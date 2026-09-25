import logging
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("RestauranteInteligente.ML.Redis")

_redis_pool: Optional[aioredis.ConnectionPool] = None


def build_channel_name(tenant_id: str) -> str:
    """Retorna o canal SSE padronizado no Redis com hash tag do tenant."""
    return f"{{{tenant_id}}}:events:stream"


def build_idempotency_key(tenant_id: str, operation_key: str) -> str:
    """Retorna a chave de idempotência padronizada no Redis com hash tag."""
    return f"{{{tenant_id}}}:idempotency:{operation_key.strip()}"


def build_lock_key(tenant_id: str, resource_key: str) -> str:
    """Retorna a chave de lock distribuído padronizada no Redis com hash tag."""
    return f"{{{tenant_id}}}:lock:{resource_key.strip()}"


async def init_redis_pool() -> aioredis.ConnectionPool:
    global _redis_pool
    if _redis_pool is None:
        logger.info(
            "Inicializando pool de conexões Redis em %s:%s...",
            settings.REDIS_HOST,
            settings.REDIS_PORT
        )
        _redis_pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=20,
            decode_responses=True,
            health_check_interval=30
        )
    return _redis_pool


async def close_redis_pool() -> None:
    global _redis_pool
    if _redis_pool is not None:
        logger.info("Fechando pool de conexões Redis...")
        await _redis_pool.disconnect()
        _redis_pool = None


def get_redis_client() -> aioredis.Redis:
    if _redis_pool is None:
        raise RuntimeError("O pool do Redis não foi inicializado. Verifique o lifespan do FastAPI.")
    return aioredis.Redis(connection_pool=_redis_pool)
