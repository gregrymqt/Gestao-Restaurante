import asyncio
import contextlib
import logging
from typing import AsyncGenerator
from fastapi import FastAPI
from app.core.config import settings
from app.core.redis_client import close_redis_pool, init_redis_pool
from app.services.rabbit_consumer import RabbitConsumer

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s", "level":"%(levelname)s", "name":"%(name)s", "message":"%(message)s"}'
)
logger = logging.getLogger("RestauranteInteligente.ML.Main")


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Iniciando serviço %s...", settings.PROJECT_NAME)
    await init_redis_pool()

    rabbit_consumer = RabbitConsumer()
    consumer_task = asyncio.create_task(rabbit_consumer.start())

    try:
        yield
    finally:
        logger.info("Encerrando conexões do serviço %s...", settings.PROJECT_NAME)
        consumer_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await consumer_task
        await rabbit_consumer.stop()
        await close_redis_pool()


app = FastAPI(
    title="Restaurante Inteligente - ML Worker",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health_check() -> dict:
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }
