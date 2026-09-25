# ==============================================================================
# Manual Canónico de Machine Learning: Python 3.12
# Consumidor Assíncrono AMQP Resiliente com aio-pika e Dead Lettering (DLX/DLQ)
# ==============================================================================

import asyncio
import logging
from typing import Any
import aio_pika
from pydantic import ValidationError

from app.schemas.messaging import (
    PrevisaoDemandaSolicitadaEvent,
    RetreinoModeloSolicitadoEvent
)
from app.services.prediction_service import DemandPredictionService
from app.models.demand_model import DemandPredictionEngine

logger = logging.getLogger("RestauranteInteligente.ML")


class RabbitMQConsumer:
    def __init__(
        self, 
        prediction_service: DemandPredictionService,
        prediction_engine: DemandPredictionEngine,
        amqp_url: str = "amqp://guest:guest@localhost:5672/",
        prefetch_count: int = 10
    ) -> None:
        self._prediction_service = prediction_service
        self._prediction_engine = prediction_engine
        self._amqp_url = amqp_url
        self._prefetch_count = prefetch_count
        self._connection: aio_pika.abc.AbstractRobustConnection | None = None
        self._channel: aio_pika.abc.AbstractRobustChannel | None = None

    async def connect(self) -> None:
        self._connection = await aio_pika.connect_robust(
            self._amqp_url,
            client_properties={"connection_name": "python_ml_demand_worker"}
        )
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=self._prefetch_count)
        logger.info("[INFO] Conexão robusta estabelecida com o RabbitMQ.")

    async def start_consuming(self) -> None:
        if not self._channel:
            raise RuntimeError("Tentativa de iniciar escuta sem canal AMQP inicializado.")

        # 1. Configuração da Dead Letter Exchange (DLX) e Dead Letter Queue (DLQ)
        dlx_exchange = await self._channel.declare_exchange(
            "dlx.restaurante", aio_pika.ExchangeType.DIRECT, durable=True
        )
        dlq_queue = await self._channel.declare_queue("queue:previsao_demanda_dlq", durable=True)
        await dlq_queue.bind(dlx_exchange, routing_key="previsao.solicitada.dead")

        # 2. Fila Principal de Inferência
        inference_queue = await self._channel.declare_queue(
            "queue:previsao_demanda_solicitada",
            durable=True,
            arguments={
                "x-dead-letter-exchange": "dlx.restaurante",
                "x-dead-letter-routing-key": "previsao.solicitada.dead",
            }
        )
        await inference_queue.consume(self._process_inference_message)

        # 3. Fila de Retreino Offline de Modelos
        retrain_queue = await self._channel.declare_queue(
            "queue:retreino_modelo_solicitado",
            durable=True,
            arguments={
                "x-dead-letter-exchange": "dlx.restaurante",
                "x-dead-letter-routing-key": "previsao.solicitada.dead",
            }
        )
        await retrain_queue.consume(self._process_retrain_message)

        logger.info("[INFO] Filas de inferência e retreino configuradas com sucesso.")

    async def _process_inference_message(
        self, message: aio_pika.abc.AbstractIncomingMessage
    ) -> None:
        # Modo estrito: auto_ack desativado, processamento sob context manager
        async with message.process(requeue=False, ignore_processed=True):
            try:
                payload_text = message.body.decode("utf-8")
                event = PrevisaoDemandaSolicitadaEvent.model_validate_json(payload_text)

                logger.info(
                    "[INFO] Processando cálculo preditivo. CorrelationId=%s RestauranteId=%s",
                    event.correlation_id, event.restaurante_id
                )

                # Processamento assíncrono não-bloqueante
                resultado_event = await self._prediction_service.executar_previsao(event)

                # Publicação na fila de retorno do C#
                await self._publicar_resultado(
                    resultado_event.model_dump_json(by_alias=True).encode("utf-8"),
                    routing_key="queue:previsao_consolidada_csharp"
                )

            except ValidationError as val_err:
                logger.error("[ERROR] Payload inválido. Rejeitando para DLQ: %s", val_err)
                await message.reject(requeue=False)
            except Exception as err:
                logger.exception("[ERROR] Falha durante inferência. Rejeitando para DLQ: %s", err)
                await message.reject(requeue=False)

    async def _process_retrain_message(
        self, message: aio_pika.abc.AbstractIncomingMessage
    ) -> None:
        async with message.process(requeue=False, ignore_processed=True):
            try:
                payload_text = message.body.decode("utf-8")
                event = RetreinoModeloSolicitadoEvent.model_validate_json(payload_text)

                logger.info(
                    "[INFO] Iniciando retreino de modelo. CorrelationId=%s Versao=%s",
                    event.correlation_id, event.nova_versao
                )

                # Monta DataFrames e delega treinamento para thread separada
                registos = [d.model_dump() for d in event.dados_treinamento]
                df = pd.DataFrame(registos)
                X = df.drop(columns=["quantidade", "data", "produto_id"])
                y = df["quantidade"]

                metricas = await asyncio.to_thread(
                    self._prediction_engine.treinar_offline, X, y, event.nova_versao
                )

                logger.info("[INFO] Retreino concluído com sucesso. Métricas: %s", metricas)

            except Exception as err:
                logger.exception("[ERROR] Falha durante o retreino. Rejeitando: %s", err)
                await message.reject(requeue=False)

    async def _publicar_resultado(self, payload: bytes, routing_key: str) -> None:
        if not self._channel:
            raise RuntimeError("Canal AMQP não inicializado para publicação.")

        await self._channel.default_exchange.publish(
            aio_pika.Message(
                body=payload,
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key=routing_key
        )

    async def close(self) -> None:
        if self._connection and not self._connection.is_closed:
            await self._connection.close()
            logger.info("[INFO] Conexão com o RabbitMQ encerrada com sucesso.")
