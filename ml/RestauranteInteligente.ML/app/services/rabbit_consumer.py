import asyncio
import json
import logging
from typing import Optional
import aio_pika
from aio_pika.abc import AbstractRobustConnection, AbstractChannel, AbstractQueue

from app.core.config import settings
from app.schemas.messaging import (
    PrevisaoDemandaSolicitadaMessage,
    PrevisaoDemandaConcluidaMessage,
)
from app.services.ml_service import MLPredictionService
from app.services.event_publisher import publish_tenant_event

logger = logging.getLogger("RestauranteInteligente.ML.RabbitConsumer")


class RabbitConsumer:
    """
    Consumidor resiliente RabbitMQ usando aio-pika para o microsserviço Python ML.
    Implementa:
    - Dead Letter Exchange ('dlx.restaurante') e Dead Letter Queue ('dlq.previsao.demanda.solicitada')
    - Confirmação manual (manual ack/nack) via context manager do aio-pika
    - Rejeição segura com roteamento para DLQ em caso de payload inválido ou exceção não recuperável
    - Publicação em Raw JSON na fila/exchange 'previsao.demanda.concluida'
    - Segregação física absoluta: NENHUMA conexão a banco de dados relacional.
    """

    def __init__(self, ml_service: Optional[MLPredictionService] = None) -> None:
        self.ml_service = ml_service or MLPredictionService()
        self.connection: Optional[AbstractRobustConnection] = None
        self.channel: Optional[AbstractChannel] = None
        self.queue: Optional[AbstractQueue] = None
        self._is_running: bool = False
        self._consume_task: Optional[asyncio.Task] = None

    async def connect_and_setup(self) -> None:
        """
        Estabelece conexão robusta e declara topologia de mensageria com DLX/DLQ.
        """
        logger.info("Conectando ao broker RabbitMQ em %s:%s...", settings.RABBITMQ_HOST, settings.RABBITMQ_PORT)
        self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        self.channel = await self.connection.channel()
        await self.channel.set_qos(prefetch_count=10)

        # 1. Declaração de Dead Letter Exchange e Queue
        dlx = await self.channel.declare_exchange("dlx.restaurante", aio_pika.ExchangeType.DIRECT, durable=True)
        dlq = await self.channel.declare_queue("dlq.previsao.demanda.solicitada", durable=True)
        await dlq.bind(dlx, routing_key="previsao.demanda.solicitada")

        # 2. Declaração da exchange e fila de entrada com DLX configurada
        main_exchange = await self.channel.declare_exchange(
            "previsao.demanda.solicitada",
            aio_pika.ExchangeType.FANOUT,
            durable=True
        )

        self.queue = await self.channel.declare_queue(
            "previsao.demanda.solicitada",
            durable=True,
            arguments={
                "x-dead-letter-exchange": "dlx.restaurante",
                "x-dead-letter-routing-key": "previsao.demanda.solicitada"
            }
        )
        await self.queue.bind(main_exchange)

        # 3. Declaração da fila de saída consumida pelo backend C# .NET 9
        await self.channel.declare_queue("previsao.demanda.concluida", durable=True)

        logger.info("Topologia RabbitMQ inicializada com sucesso (Fila principal, DLX e DLQ).")

    async def _process_single_message(self, message: aio_pika.IncomingMessage) -> None:
        """
        Processa individualmente uma mensagem recebida.
        Se ocorrer exceção, rejeita sem requeue, encaminhando para a DLQ via DLX.
        """
        # CLÁUSULA INEGOCIÁVEL 4: Auto-ack proibido. Rejeição com requeue=False direciona para DLQ.
        async with message.process(requeue=False, reject_on_exception=True):
            try:
                body_str = message.body.decode("utf-8")
                raw_dict = json.loads(body_str)
                solicitacao = PrevisaoDemandaSolicitadaMessage.model_validate(raw_dict)
            except Exception as parse_err:
                logger.error("Erro crítico ao deserializar payload JSON recebido: %s. Enviando para DLQ.", parse_err)
                raise parse_err

            logger.info(
                "Processando inferência de demanda: SolicitacaoId=%s, ProdutoId=%s, Histórico=%d pontos",
                solicitacao.solicitacao_id,
                solicitacao.produto_id,
                len(solicitacao.historico_vendas_recentes)
            )

            # Execução de inferência via thread separada desacoplada do loop
            resultado = await self.ml_service.calcular_previsao(solicitacao)

            # Publicação de resposta em Raw JSON para o backend C# .NET
            payload_resposta = resultado.model_dump_json(by_alias=True).encode("utf-8")
            response_msg = aio_pika.Message(
                body=payload_resposta,
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            )

            assert self.channel is not None
            await self.channel.default_exchange.publish(
                response_msg,
                routing_key="previsao.demanda.concluida"
            )

            logger.info(
                "Previsão concluída enviada para 'previsao.demanda.concluida': SolicitacaoId=%s, Qtd=%s",
                resultado.solicitacao_id,
                resultado.quantidade_prevista
            )

            # Emissão de evento de progresso em tempo real no canal SSE do Redis (não-bloqueante)
            try:
                await publish_tenant_event(
                    tenant_id=str(solicitacao.restaurante_id),
                    event_type="ML_PREVISION_COMPLETED",
                    payload={
                        "solicitacaoId": str(solicitacao.solicitacao_id),
                        "produtoId": str(solicitacao.produto_id),
                        "quantidadePrevista": str(resultado.quantidade_prevista),
                        "modeloVersao": resultado.modelo_versao
                    }
                )
            except Exception as sse_err:
                logger.warning("Falha ao publicar evento de progresso SSE no Redis: %s", sse_err)

    async def start(self) -> None:
        """
        Inicia o loop assíncrono de consumo de mensagens.
        """
        self._is_running = True
        try:
            await self.connect_and_setup()
            assert self.queue is not None

            logger.info("Aguardando mensagens na fila 'previsao.demanda.solicitada'...")
            async with self.queue.iterator() as queue_iter:
                async for message in queue_iter:
                    if not self._is_running:
                        break
                    await self._process_single_message(message)
        except asyncio.CancelledError:
            logger.info("Loop do RabbitConsumer cancelado.")
        except Exception as ex:
            logger.error("Erro inesperado no loop do consumidor RabbitMQ: %s", ex, exc_info=True)
        finally:
            await self.stop()

    async def stop(self) -> None:
        """
        Encerra graciosamente canal e conexão com o broker RabbitMQ.
        """
        self._is_running = False
        logger.info("Encerrando consumidor RabbitMQ...")

        if self.channel and not self.channel.is_closed:
            await self.channel.close()
        if self.connection and not self.connection.is_closed:
            await self.connection.close()

        logger.info("Consumidor RabbitMQ finalizado com sucesso.")
