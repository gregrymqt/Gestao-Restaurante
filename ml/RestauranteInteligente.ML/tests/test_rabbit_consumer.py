from datetime import date
from decimal import Decimal
import json
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import pytest
from app.services.ml_service import MLPredictionService
from app.services.rabbit_consumer import RabbitConsumer


@pytest.mark.asyncio
async def test_rabbit_consumer_process_single_message_success():
    # Arrange
    ml_service_mock = AsyncMock(spec=MLPredictionService)
    consumer = RabbitConsumer(ml_service=ml_service_mock)

    channel_mock = MagicMock()
    channel_mock.default_exchange = AsyncMock()
    consumer.channel = channel_mock

    solicitacao_id = uuid4()
    restaurante_id = uuid4()
    produto_id = uuid4()

    payload_in = {
        "solicitacaoId": str(solicitacao_id),
        "restauranteId": str(restaurante_id),
        "produtoId": str(produto_id),
        "dataAlvo": "2026-09-28",
        "historicoVendasRecentes": [10.0, 15.0],
        "temperaturaPrevista": 25.0,
        "precipitacaoPrevista": 0.0
    }

    from app.schemas.messaging import PrevisaoDemandaConcluidaMessage
    ml_service_mock.calcular_previsao.return_value = PrevisaoDemandaConcluidaMessage(
        solicitacaoId=solicitacao_id,
        restauranteId=restaurante_id,
        produtoId=produto_id,
        dataAlvo=date(2026, 9, 28),
        quantidadePrevista=Decimal("18.50"),
        modeloVersao="hgb-regressor-v1"
    )

    # Mock da IncomingMessage do aio_pika como async context manager
    message_mock = MagicMock()
    message_mock.body = json.dumps(payload_in).encode("utf-8")
    process_cm = AsyncMock()
    process_cm.__aenter__.return_value = message_mock
    process_cm.__aexit__.return_value = None
    message_mock.process = MagicMock(return_value=process_cm)

    # Act
    with patch("app.services.rabbit_consumer.publish_tenant_event", new_callable=AsyncMock):
        await consumer._process_single_message(message_mock)

    # Assert
    ml_service_mock.calcular_previsao.assert_awaited_once()
    channel_mock.default_exchange.publish.assert_awaited_once()

    # Valida parâmetros da publicação de retorno
    call_args = channel_mock.default_exchange.publish.call_args
    published_msg = call_args[0][0]
    routing_key = call_args[1]["routing_key"]

    assert routing_key == "previsao.demanda.concluida"
    published_dict = json.loads(published_msg.body.decode("utf-8"))
    assert published_dict["solicitacaoId"] == str(solicitacao_id)
    assert published_dict["modeloVersao"] == "hgb-regressor-v1"


@pytest.mark.asyncio
async def test_rabbit_consumer_payload_invalido_rejeita_para_dlq():
    # Arrange
    ml_service_mock = AsyncMock(spec=MLPredictionService)
    consumer = RabbitConsumer(ml_service=ml_service_mock)

    message_mock = MagicMock()
    message_mock.body = b"NOT_A_VALID_JSON"
    process_cm = AsyncMock()
    process_cm.__aenter__.return_value = message_mock
    process_cm.__aexit__.return_value = None
    message_mock.process = MagicMock(return_value=process_cm)

    # Act & Assert
    with pytest.raises(Exception):
        await consumer._process_single_message(message_mock)

    # Valida que o process context manager foi acionado com reject_on_exception=True
    message_mock.process.assert_called_once_with(requeue=False, reject_on_exception=True)
