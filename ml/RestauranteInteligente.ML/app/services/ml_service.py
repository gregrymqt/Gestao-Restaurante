import asyncio
from decimal import Decimal
import logging
from typing import Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

from app.core.logging import trace_execution
from app.schemas.messaging import (
    PrevisaoDemandaSolicitadaMessage,
    PrevisaoDemandaConcluidaMessage,
)

logger = logging.getLogger("RestauranteInteligente.ML.MLPredictionService")


class MLPredictionService:
    """
    Serviço de Machine Learning para estimativa de demanda de produtos.
    Executa HistGradientBoostingRegressor via asyncio.to_thread para séries com >= 14 dias,
    e fallback heurístico ponderado para séries mais curtas.
    Garante não-negatividade da demanda prevista e segregação física absoluta do PostgreSQL.
    """

    @staticmethod
    def _treinar_e_prever_sync(
        historico_vendas: list[float],
        temperatura: float,
        precipitacao: float
    ) -> Tuple[Decimal, str]:
        """
        Execução síncrona em thread de processamento (CPU-bound) desacoplada do event loop.
        """
        n_pontos = len(historico_vendas)
        logger.debug("Iniciando ajuste preditivo: n_pontos=%d, temperatura=%.1f, precipitacao=%.1f", n_pontos, temperatura, precipitacao)

        # Fallback para séries menores que 14 pontos
        if n_pontos < 14:
            if n_pontos == 0:
                logger.debug("Histórico de vendas vazio (0 pontos): retornando 0.00")
                return Decimal("0.00"), "baseline-heuristic-v1"

            # Média ponderada com pesos crescentes para os dias mais recentes
            pesos = np.arange(1, n_pontos + 1, dtype=float)
            media_ponderada = float(np.average(historico_vendas, weights=pesos))
            demanda_estimada = max(0.0, round(media_ponderada, 2))
            logger.debug("Série curta (< 14 pontos): aplicando baseline heurístico ponderado -> %s", demanda_estimada)
            return Decimal(str(demanda_estimada)), "baseline-heuristic-v1"

        try:
            # Construção de features tabulares a partir da série temporal de 14+ pontos
            series = pd.Series(historico_vendas, dtype=float)
            df = pd.DataFrame({"y": series})

            df["lag_1"] = df["y"].shift(1)
            df["lag_2"] = df["y"].shift(2)
            df["lag_3"] = df["y"].shift(3)
            df["rolling_mean_3"] = df["y"].shift(1).rolling(window=3, min_periods=1).mean()
            df["rolling_mean_7"] = df["y"].shift(1).rolling(window=7, min_periods=1).mean()
            df["temperatura"] = temperatura
            df["precipitacao"] = precipitacao

            # Remove registros iniciais com NaN nos lags
            df_train = df.dropna().reset_index(drop=True)

            feature_cols = ["lag_1", "lag_2", "lag_3", "rolling_mean_3", "rolling_mean_7", "temperatura", "precipitacao"]

            if len(df_train) < 5:
                # Amostras válidas insuficientes após lags: fallback heurístico
                media = float(np.mean(historico_vendas[-7:]))
                return Decimal(str(max(0.0, round(media, 2)))), "baseline-heuristic-v1"

            X_train = df_train[feature_cols].values
            y_train = df_train["y"].values

            # Treinamento com HistGradientBoostingRegressor
            model = HistGradientBoostingRegressor(
                max_iter=50,
                min_samples_leaf=2,
                random_state=42
            )
            model.fit(X_train, y_train)

            # Vetor de features para o dia alvo (D+1)
            ultimo_val = float(historico_vendas[-1])
            penultimo_val = float(historico_vendas[-2])
            antepenultimo_val = float(historico_vendas[-3])
            ultimos_3 = float(np.mean(historico_vendas[-3:]))
            ultimos_7 = float(np.mean(historico_vendas[-7:]))

            X_target = np.array([[
                ultimo_val,
                penultimo_val,
                antepenultimo_val,
                ultimos_3,
                ultimos_7,
                temperatura,
                precipitacao
            ]])

            pred = float(model.predict(X_target)[0])
            demanda_prevista = max(0.0, round(pred, 2))
            logger.debug(
                "Modelo HGB ajustado com sucesso [linhas=%d]. Previsão pontual calculada: %s",
                len(X_train),
                demanda_prevista
            )

            return Decimal(str(demanda_prevista)), "hgb-regressor-v1"

        except Exception as ex:
            logger.warning("Falha durante ajuste do modelo HGB, aplicando fallback heurístico: %s", ex, exc_info=True)
            media = float(np.mean(historico_vendas[-7:] if n_pontos >= 7 else historico_vendas))
            return Decimal(str(max(0.0, round(media, 2)))), "baseline-heuristic-v1"

    async def calcular_previsao(
        self,
        solicitacao: PrevisaoDemandaSolicitadaMessage
    ) -> PrevisaoDemandaConcluidaMessage:
        """
        Processa a previsão de demanda disparando o pipeline matemático em thread dedicada (asyncio.to_thread).
        """
        historico_float = [float(v) for v in solicitacao.historico_vendas_recentes]
        temp_float = float(solicitacao.temperatura_prevista)
        precip_float = float(solicitacao.precipitacao_prevista)

        with trace_execution("ajuste_e_predicao_ml", logger, produtoId=str(solicitacao.produto_id)):
            quantidade_prevista, modelo_versao = await asyncio.to_thread(
                self._treinar_e_prever_sync,
                historico_float,
                temp_float,
                precip_float
            )

        logger.info(
            "Previsão calculada para SolicitacaoId=%s, ProdutoId=%s: Qtd=%s via %s",
            solicitacao.solicitacao_id,
            solicitacao.produto_id,
            quantidade_prevista,
            modelo_versao
        )

        return PrevisaoDemandaConcluidaMessage(
            solicitacaoId=solicitacao.solicitacao_id,
            restauranteId=solicitacao.restaurante_id,
            produtoId=solicitacao.produto_id,
            dataAlvo=solicitacao.data_alvo,
            quantidadePrevista=quantidade_prevista,
            modeloVersao=modelo_versao
        )
