import json
import logging
from typing import Union
from uuid import UUID
from pydantic import BaseModel
from app.core.redis_client import build_channel_name, get_redis_client
from app.schemas.events import StreamEventEnvelope

logger = logging.getLogger("RestauranteInteligente.ML.EventPublisher")


async def publish_tenant_event(
    tenant_id: str,
    event_type: str,
    payload: Union[BaseModel, dict],
    correlation_id: Union[UUID, None] = None
) -> None:
    """
    Publica um evento tipado no canal Redis do tenant especificado.
    O endpoint SSE na API .NET 9 consome este canal e transmite diretamente aos clientes.
    """
    if isinstance(payload, BaseModel):
        payload_json = payload.model_dump_json()
    else:
        payload_json = json.dumps(payload)

    envelope = StreamEventEnvelope(
        eventType=event_type,
        payloadJson=payload_json,
        correlationId=correlation_id or StreamEventEnvelope.model_fields["correlation_id"].default_factory()  # type: ignore
    )

    channel_name = build_channel_name(tenant_id)
    redis = get_redis_client()

    # O envelope serializado em formato JSON é transmitido pelo Redis Pub/Sub
    serialized_envelope = envelope.model_dump_json(by_alias=True)
    await redis.publish(channel_name, serialized_envelope)

    logger.debug(
        "Evento '%s' publicado com sucesso no canal Redis '%s' (Correlation: %s).",
        event_type,
        channel_name,
        envelope.correlation_id
    )
