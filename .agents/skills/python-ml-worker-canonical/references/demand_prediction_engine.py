# ==============================================================================
# Manual Canónico de Machine Learning: Python 3.12
# Motor de Predição e Treinamento Não-Bloqueante com TimeSeriesSplit
# ==============================================================================

import asyncio
from datetime import datetime, timezone
from decimal import Decimal
import json
import os
import shutil
import joblib
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error

from app.schemas.messaging import (
    PrevisaoDemandaSolicitadaEvent,
    PrevisaoProdutoResultado,
    PrevisaoDemandaCalculadaEvent,
    RetreinoModeloSolicitadoEvent
)
from app.preprocessing.feature_pipeline import FeatureEngineeringPipeline


class DemandPredictionEngine:
    def __init__(
        self, 
        artifacts_dir: str = "artifacts",
        model_filename: str = "demand_regressor_latest.joblib"
    ) -> None:
        self._artifacts_dir = artifacts_dir
        self._latest_model_path = os.path.join(artifacts_dir, model_filename)
        self._manifest_path = os.path.join(artifacts_dir, "manifest.json")
        self._model: HistGradientBoostingRegressor | None = None
        self._versao: str = "1.0.0"

    def carregar_modelo(self) -> None:
        """Carrega os pesos do modelo na inicialização (Lifespan Startup)."""
        os.makedirs(os.path.join(self._artifacts_dir, "models"), exist_ok=True)

        if os.path.exists(self._latest_model_path):
            dados_artefato = joblib.load(self._latest_model_path)
            self._model = dados_artefato["modelo"]
            self._versao = dados_artefato.get("versao", "1.0.0")
        else:
            # Fallback seguro para inicialização a frio
            self._model = HistGradientBoostingRegressor(
                loss="squared_error",
                max_iter=150,
                max_depth=6,
                min_samples_leaf=5,
                early_stopping=True,
                random_state=42
            )

    async def prever_itens(
        self, event: PrevisaoDemandaSolicitadaEvent, features_df: pd.DataFrame
    ) -> list[PrevisaoProdutoResultado]:
        """
        Executa inferência CPU delegada para threadpool, protegendo o loop assíncrono.
        """
        if not self._model:
            raise RuntimeError("O modelo preditivo não foi inicializado em memória.")

        def _executar_inferencia_cpu() -> list[PrevisaoProdutoResultado]:
            resultados: list[PrevisaoProdutoResultado] = []
            
            for produto in event.produtos:
                df_produto = features_df.copy()
                df_produto["preco_venda"] = float(produto.preco_venda)

                pred_raw = self._model.predict(df_produto)[0]
                pred_final = max(0.0, float(pred_raw)) # Invariante: demanda >= 0

                resultados.append(
                    PrevisaoProdutoResultado(
                        produto_id=produto.produto_id,
                        demanda_prevista=Decimal(str(round(pred_final, 2)))
                    )
                )
            return resultados

        return await asyncio.to_thread(_executar_inferencia_cpu)

    def treinar_offline(self, X: pd.DataFrame, y: pd.Series, nova_versao: str) -> dict[str, float]:
        """
        Treina o modelo com divisão temporal estrita (TimeSeriesSplit) para impedir data leakage.
        """
        tscv = TimeSeriesSplit(n_splits=5)
        scores: list[float] = []

        for train_idx, val_idx in tscv.split(X):
            X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]

            regressor = HistGradientBoostingRegressor(
                max_iter=200, learning_rate=0.05, max_depth=6, random_state=42
            )
            regressor.fit(X_tr, y_tr)
            preds = regressor.predict(X_val)
            scores.append(mean_absolute_error(y_val, preds))

        mae_medio = float(sum(scores) / len(scores))

        # Retreino final no conjunto histórico completo
        modelo_consolidado = HistGradientBoostingRegressor(
            max_iter=200, learning_rate=0.05, max_depth=6, random_state=42
        )
        modelo_consolidado.fit(X, y)

        # 1. Salva artefato semântico
        caminho_versao = os.path.join(self._artifacts_dir, "models", f"demand_regressor_v{nova_versao}.joblib")
        joblib.dump(
            {"modelo": modelo_consolidado, "versao": nova_versao, "mae": mae_medio},
            caminho_versao
        )

        # 2. Atualiza ponteiro para latest
        shutil.copyfile(caminho_versao, self._latest_model_path)

        # 3. Atualiza manifesto JSON
        manifesto = {
            "ultima_atualizacao_utc": datetime.now(timezone.utc).isoformat(),
            "versao_ativa": nova_versao,
            "mae_cross_validation": mae_medio,
            "total_amostras": len(X),
            "artefato_path": caminho_versao
        }
        with open(self._manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifesto, f, indent=2)

        # Atualiza a referência em memória sem reiniciar o processo
        self._model = modelo_consolidado
        self._versao = nova_versao

        return {"mae_cross_validation": mae_medio}


class DemandPredictionService:
    def __init__(self, engine: DemandPredictionEngine) -> None:
        self._engine = engine

    async def executar_previsao(
        self, event: PrevisaoDemandaSolicitadaEvent
    ) -> PrevisaoDemandaCalculadaEvent:
        baseline = FeatureEngineeringPipeline.calcular_baseline_heuristico(event)
        historico_len = len(event.historico_vendas)

        # Fallback gracioso: entre 7 e 13 dias utiliza o baseline heurístico
        if historico_len < 14:
            previsoes = [
                PrevisaoProdutoResultado(
                    produto_id=p.produto_id,
                    demanda_prevista=baseline
                )
                for p in event.produtos
            ]
            versao_usada = "baseline-heuristic-v1"
        else:
            features_df = FeatureEngineeringPipeline.construir_features_predicao(event)
            previsoes = await self._engine.prever_itens(event, features_df)
            versao_usada = self._engine._versao

        return PrevisaoDemandaCalculadaEvent(
            correlation_id=event.correlation_id,
            restaurante_id=event.restaurante_id,
            data_previsao=event.data_alvo,
            modelo_versao=versao_usada,
            baseline_demanda=baseline,
            previsoes=previsoes
        )
