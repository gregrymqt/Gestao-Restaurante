import asyncio
import contextlib
import logging
import sys
from pathlib import Path
from typing import AsyncGenerator

# Garante que a raiz do microsserviço (ml/RestauranteInteligente.ML) esteja no sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from app.core.config import settings
from app.core.logging import configure_logging, trace_execution
from app.core.redis_client import close_redis_pool, init_redis_pool
from app.services.rabbit_consumer import RabbitConsumer

# Inicialização do sistema de logging unificado e estruturado
configure_logging(
    level=settings.LOG_LEVEL,
    log_to_file=settings.LOG_TO_FILE,
    log_file_path=settings.LOG_FILE_PATH,
    format_type=settings.LOG_FORMAT
)
logger = logging.getLogger("RestauranteInteligente.ML.Main")


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(
        "Iniciando serviço %s (Ambiente: %s, Nível de Log: %s)...",
        settings.PROJECT_NAME,
        settings.ENVIRONMENT,
        settings.LOG_LEVEL
    )
    with trace_execution("inicializacao_pool_redis", logger):
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
    logger.debug("Health check requisitado com sucesso.")
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "logLevel": settings.LOG_LEVEL
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=str(PROJECT_ROOT))

