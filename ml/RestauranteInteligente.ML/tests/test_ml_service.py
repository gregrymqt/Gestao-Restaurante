from datetime import date
from decimal import Decimal
from uuid import uuid4
import pytest
from app.schemas.messaging import PrevisaoDemandaSolicitadaMessage
from app.services.ml_service import MLPredictionService


@pytest.mark.asyncio
async def test_calcular_previsao_com_14_pontos_utiliza_hgb_regressor():
    service = MLPredictionService()

    # Série histórica de 14 dias
    historico = [Decimal(str(v)) for v in [10, 12, 11, 14, 15, 13, 16, 18, 17, 19, 20, 22, 21, 25]]

    solicitacao = PrevisaoDemandaSolicitadaMessage(
        solicitacaoId=uuid4(),
        restauranteId=uuid4(),
        produtoId=uuid4(),
        dataAlvo=date(2026, 9, 28),
        historicoVendasRecentes=historico,
        temperaturaPrevista=Decimal("27.0"),
        precipitacaoPrevista=Decimal("0.0")
    )

    resultado = await service.calcular_previsao(solicitacao)

    assert resultado.solicitacao_id == solicitacao.solicitacao_id
    assert resultado.restaurante_id == solicitacao.restaurante_id
    assert resultado.produto_id == solicitacao.produto_id
    assert resultado.data_alvo == solicitacao.data_alvo
    assert resultado.modelo_versao == "hgb-regressor-v1"
    assert resultado.quantidade_prevista >= Decimal("0.00")


@pytest.mark.asyncio
async def test_calcular_previsao_com_poucos_pontos_aplica_fallback_heuristico():
    service = MLPredictionService()

    # Série curta (< 14 pontos)
    historico = [Decimal("10.0"), Decimal("15.0"), Decimal("20.0")]

    solicitacao = PrevisaoDemandaSolicitadaMessage(
        solicitacaoId=uuid4(),
        restauranteId=uuid4(),
        produtoId=uuid4(),
        dataAlvo=date(2026, 9, 28),
        historicoVendasRecentes=historico,
        temperaturaPrevista=Decimal("25.0"),
        precipitacaoPrevista=Decimal("0.0")
    )

    resultado = await service.calcular_previsao(solicitacao)

    assert resultado.modelo_versao == "baseline-heuristic-v1"
    assert resultado.quantidade_prevista >= Decimal("0.00")
    # Média ponderada com pesos crescentes: (10*1 + 15*2 + 20*3)/(1+2+3) = (10+30+60)/6 = 100/6 ~ 16.67
    assert resultado.quantidade_prevista == Decimal("16.67")


@pytest.mark.asyncio
async def test_calcular_previsao_sem_historico_retorna_zero():
    service = MLPredictionService()

    solicitacao = PrevisaoDemandaSolicitadaMessage(
        solicitacaoId=uuid4(),
        restauranteId=uuid4(),
        produtoId=uuid4(),
        dataAlvo=date(2026, 9, 28),
        historicoVendasRecentes=[],
        temperaturaPrevista=Decimal("25.0"),
        precipitacaoPrevista=Decimal("0.0")
    )

    resultado = await service.calcular_previsao(solicitacao)

    assert resultado.modelo_versao == "baseline-heuristic-v1"
    assert resultado.quantidade_prevista == Decimal("0.00")
