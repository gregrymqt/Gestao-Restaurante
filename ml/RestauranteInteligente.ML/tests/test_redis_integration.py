import json
from unittest.mock import AsyncMock, patch
import pytest
from app.core.redis_client import build_channel_name, build_idempotency_key, build_lock_key
from app.messaging.idempotency import (
    distributed_lock,
    mark_idempotency_completed,
    release_idempotency,
    try_acquire_idempotency,
)
from app.schemas.events import (
    MLInferenceProgressPayload,
    ScrapingProgressPayload,
    StreamEventEnvelope,
)
from app.services.event_publisher import publish_tenant_event


def test_key_builders_devem_possuir_hashtags() -> None:
    tenant_id = "tenant-restaurante-abc"

    assert build_channel_name(tenant_id) == "{tenant-restaurante-abc}:events:stream"
    assert build_idempotency_key(tenant_id, "op-1") == "{tenant-restaurante-abc}:idempotency:op-1"
    assert build_lock_key(tenant_id, "lock-1") == "{tenant-restaurante-abc}:lock:lock-1"


def test_schemas_pydantic_v2_validacao_estrita() -> None:
    scraping_event = ScrapingProgressPayload(
        status="PROCESSANDO",
        progress_percentage=45,
        items_extracted=120,
        detail="Scraping página 4 de 10"
    )
    assert scraping_event.progress_percentage == 45
    assert scraping_event.items_extracted == 120

    inference_event = MLInferenceProgressPayload(
        step="HIST_GRADIENT_BOOSTING",
        progress_percentage=80,
        current_product_id="prod-pizza-calabresa",
        detail="Cross-validation fold 4/5"
    )
    assert inference_event.step == "HIST_GRADIENT_BOOSTING"

    envelope = StreamEventEnvelope(
        eventType="ScrapingProgresso",
        payloadJson=scraping_event.model_dump_json()
    )
    dumped = envelope.model_dump(by_alias=True)
    assert dumped["eventType"] == "ScrapingProgresso"
    assert "payloadJson" in dumped
    assert "timestamp" in dumped
    assert "correlationId" in dumped


@pytest.mark.asyncio
async def test_publish_tenant_event_deve_publicar_no_canal_correto() -> None:
    tenant_id = "tenant-restaurante-abc"
    mock_redis = AsyncMock()

    with patch("app.services.event_publisher.get_redis_client", return_value=mock_redis):
        payload = {"status": "EXTRAÇÃO_CONCLUÍDA", "itens": 150}
        await publish_tenant_event(tenant_id, "ScrapingFinalizado", payload)

        mock_redis.publish.assert_called_once()
        args, _ = mock_redis.publish.call_args
        assert args[0] == "{tenant-restaurante-abc}:events:stream"

        envelope_data = json.loads(args[1])
        assert envelope_data["eventType"] == "ScrapingFinalizado"
        assert json.loads(envelope_data["payloadJson"]) == payload


@pytest.mark.asyncio
async def test_try_acquire_idempotency_quando_livre_retorna_true() -> None:
    tenant_id = "tenant-restaurante-abc"
    mock_redis = AsyncMock()
    mock_redis.set.return_value = True

    with patch("app.messaging.idempotency.get_redis_client", return_value=mock_redis):
        result = await try_acquire_idempotency(tenant_id, "op-unique-42", ttl_seconds=300)
        assert result is True
        mock_redis.set.assert_called_once_with(
            "{tenant-restaurante-abc}:idempotency:op-unique-42",
            "PROCESSING",
            ex=300,
            nx=True
        )


@pytest.mark.asyncio
async def test_try_acquire_idempotency_quando_ocupado_retorna_false() -> None:
    tenant_id = "tenant-restaurante-abc"
    mock_redis = AsyncMock()
    mock_redis.set.return_value = False

    with patch("app.messaging.idempotency.get_redis_client", return_value=mock_redis):
        result = await try_acquire_idempotency(tenant_id, "op-unique-42", ttl_seconds=300)
        assert result is False


@pytest.mark.asyncio
async def test_distributed_lock_aquisicao_e_liberacao_lua() -> None:
    tenant_id = "tenant-restaurante-abc"
    mock_redis = AsyncMock()
    mock_redis.set.return_value = True
    mock_redis.eval.return_value = 1

    with patch("app.messaging.idempotency.get_redis_client", return_value=mock_redis):
        async with distributed_lock(tenant_id, "insumo-queijo", ttl_seconds=10, timeout_seconds=1.0) as token:
            assert len(token) > 0

        # Verifica liberação com script Lua
        mock_redis.eval.assert_called_once()
        eval_args, _ = mock_redis.eval.call_args
        assert "redis.call(\"get\", KEYS[1]) == ARGV[1]" in eval_args[0]
        assert eval_args[1] == 1  # 1 chave
        assert eval_args[2] == "{tenant-restaurante-abc}:lock:insumo-queijo"
        assert eval_args[3] == token
