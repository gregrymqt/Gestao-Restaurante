# ==============================================================================
# Manual Canónico de Machine Learning: Python 3.12
# Inicialização Canônica com FastAPI Lifespan e Pré-Aquecimento de Modelos
# ==============================================================================

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI

from app.messaging.consumer import RabbitMQConsumer
from app.models.demand_model import DemandPredictionEngine, DemandPredictionService
from app.core.config import settings

# Instâncias singleton da camada analítica
prediction_engine = DemandPredictionEngine()
prediction_service = DemandPredictionService(prediction_engine)
consumer = RabbitMQConsumer(
    prediction_service=prediction_service,
    prediction_engine=prediction_engine,
    amqp_url=settings.RABBITMQ_URL,
    prefetch_count=settings.RABBITMQ_PREFETCH_COUNT
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Gerenciador de Ciclo de Vida da Aplicação:
    1. Startup: Pré-carregamento síncrono de pesos em memória volátil.
    2. Startup: Conexão e ativação de escuta do RabbitMQ.
    3. Shutdown: Cancelamento cooperativo e fechamento de sockets.
    """
    # 1. Carregamento de pesos antes de receber tráfego
    prediction_engine.carregar_modelo()

    # 2. Conexão AMQP e ativação da tarefa de consumo em background
    await consumer.connect()
    task_consumo = asyncio.create_task(consumer.start_consuming())

    yield

    # 3. Shutdown gracioso
    task_consumo.cancel()
    try:
        await task_consumo
    except asyncio.CancelledError:
        pass
    await consumer.close()


app = FastAPI(
    title="Restaurante Inteligente - ML Worker Engine",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health", tags=["Infraestrutura"])
async def health_check() -> dict[str, str]:
    """Endpoint de sondagem de saúde operacional para orquestradores (Docker/K8s)."""
    return {
        "status": "healthy",
        "service": "ml_demand_worker",
        "model_version": prediction_engine._versao
    }
