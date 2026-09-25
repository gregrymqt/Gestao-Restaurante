import asyncio
from contextlib import asynccontextmanager
import logging
import random
import uuid
from typing import AsyncGenerator
from app.core.redis_client import build_idempotency_key, build_lock_key, get_redis_client

logger = logging.getLogger("RestauranteInteligente.ML.Idempotency")

RELEASE_LOCK_LUA_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


async def try_acquire_idempotency(
    tenant_id: str,
    operation_key: str,
    ttl_seconds: int = 86400
) -> bool:
    """
    Executa verificação atômica SET NX EX no Redis.
    Retorna True se for o primeiro processamento; False se a chave já existir.
    """
    redis = get_redis_client()
    key = build_idempotency_key(tenant_id, operation_key)

    acquired = await redis.set(key, "PROCESSING", ex=ttl_seconds, nx=True)
    if acquired:
        logger.debug("Idempotência adquirida para '%s' (TTL: %ss).", key, ttl_seconds)
        return True

    logger.warning("Mensagem duplicada detectada para '%s'. Descartando processamento redundante.", key)
    return False


async def mark_idempotency_completed(
    tenant_id: str,
    operation_key: str,
    retention_seconds: int = 86400
) -> None:
    """Marca a chave como CONCLUÍDA com período de retenção para deduplicação contínua."""
    redis = get_redis_client()
    key = build_idempotency_key(tenant_id, operation_key)
    await redis.set(key, "COMPLETED", ex=retention_seconds)
    logger.debug("Idempotência marcada como COMPLETED para '%s'.", key)


async def release_idempotency(tenant_id: str, operation_key: str) -> None:
    """Remove a chave em caso de erro transitório no processamento."""
    redis = get_redis_client()
    key = build_idempotency_key(tenant_id, operation_key)
    await redis.delete(key)
    logger.debug("Chave de idempotência liberada para '%s'.", key)


@asynccontextmanager
async def distributed_lock(
    tenant_id: str,
    resource_key: str,
    ttl_seconds: int = 30,
    timeout_seconds: float = 5.0
) -> AsyncGenerator[str, None]:
    """
    Adquire um lock distribuído resiliente utilizando token de posse e liberação segura via script Lua.
    Lança TimeoutError caso o tempo limite de aquisição expire.
    """
    redis = get_redis_client()
    lock_key = build_lock_key(tenant_id, resource_key)
    token = uuid.uuid4().hex

    loop = asyncio.get_running_loop()
    start_time = loop.time()

    acquired = False
    while loop.time() - start_time < timeout_seconds:
        if await redis.set(lock_key, token, ex=ttl_seconds, nx=True):
            acquired = True
            logger.debug("Lock distribuído obtido para '%s' com token '%s'.", lock_key, token)
            break

        # Jitter aleatório para evitar colisão em concorrência
        jitter = random.uniform(0.05, 0.12)
        await asyncio.sleep(jitter)

    if not acquired:
        raise TimeoutError(f"Não foi possível obter o lock para '{lock_key}' dentro de {timeout_seconds}s.")

    try:
        yield token
    finally:
        try:
            released = await redis.eval(RELEASE_LOCK_LUA_SCRIPT, 1, lock_key, token)  # type: ignore
            if released == 1:
                logger.debug("Lock para '%s' liberado com sucesso.", lock_key)
            else:
                logger.warning("Lock para '%s' já havia expirado ou pertence a outro processo.", lock_key)
        except Exception as exc:
            logger.error("Erro ao liberar lock para '%s': %s", lock_key, exc)
