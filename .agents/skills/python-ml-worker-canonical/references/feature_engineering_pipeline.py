# ==============================================================================
# Manual Canónico de Machine Learning: Python 3.12
# Pipeline de Engenharia de Atributos (Feature Engineering) e Baseline Heurístico
# ==============================================================================

from decimal import Decimal
import numpy as np
import pandas as pd
from app.schemas.messaging import PrevisaoDemandaSolicitadaEvent


class FeatureEngineeringPipeline:
    @staticmethod
    def calcular_baseline_heuristico(event: PrevisaoDemandaSolicitadaEvent) -> Decimal:
        """
        Calcula a média móvel simples ponderada sobre a janela dos últimos 7 dias:
        y_baseline(t) = 1/7 * sum(y(t - k))
        """
        registos = sorted(event.historico_vendas, key=lambda x: x.data)
        ultimos_7 = [p.quantidade for p in registos[-7:]]
        
        if not ultimos_7:
            return Decimal("0.00")
            
        media = sum(ultimos_7) / len(ultimos_7)
        return Decimal(str(round(media, 2)))

    @staticmethod
    def construir_features_predicao(event: PrevisaoDemandaSolicitadaEvent) -> pd.DataFrame:
        """
        Transforma a série temporal em atributos tabulares para inferência de Machine Learning:
        - Lags temporais autorregressivos (lag_1, lag_7)
        - Estatísticas móveis sem data leakage (rolling_mean_7, rolling_std_7)
        - Decomposição trigonométrica cíclica do dia da semana (sin, cos)
        - Variáveis exógenas de contexto (clima, preço)
        """
        registos = [
            {"data": p.data, "quantidade": p.quantidade} 
            for p in event.historico_vendas
        ]
        df = pd.DataFrame(registos).sort_values("data").reset_index(drop=True)

        if len(df) < 14:
            raise ValueError(
                f"Histórico insuficiente para inferência ML: {len(df)} pontos fornecidos, mínimo de 14 requerido."
            )

        # 1. Lags temporais autorregressivos com shift(1) para evitar vazamento do próprio dia
        df["lag_1"] = df["quantidade"].shift(1)
        df["lag_7"] = df["quantidade"].shift(7)

        # 2. Estatísticas de janela rolante
        df["rolling_mean_7"] = df["quantidade"].shift(1).rolling(window=7).mean()
        df["rolling_std_7"] = df["quantidade"].shift(1).rolling(window=7).std().fillna(0)

        # 3. Projeção cíclica da data alvo (calendário)
        dia_semana = event.data_alvo.weekday() # 0 = Segunda, 6 = Domingo
        sin_dia = float(np.sin(2 * np.pi * dia_semana / 7.0))
        cos_dia = float(np.cos(2 * np.pi * dia_semana / 7.0))

        ultima_linha = df.iloc[-1]

        features_matriz = {
            "lag_1": [float(ultima_linha["quantidade"])],
            "lag_7": [float(df.iloc[-7]["quantidade"])],
            "rolling_mean_7": [float(df["quantidade"].tail(7).mean())],
            "rolling_std_7": [float(df["quantidade"].tail(7).std(ddof=0))],
            "sin_dia_semana": [sin_dia],
            "cos_dia_semana": [cos_dia],
            "temperatura": [float(event.clima.temperatura)],
            "precipitacao": [float(event.clima.precipitacao)],
            "umidade": [float(event.clima.umidade)],
        }

        return pd.DataFrame(features_matriz)
