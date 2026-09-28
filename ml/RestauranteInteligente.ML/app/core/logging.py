"""
Sistema de Logging Estruturado e Depuração do Microsserviço Python ML.
Implementa:
- Formatação dupla: JSON estruturado (produção/observabilidade) e Console legível (depuração local)
- Contexto de rastreamento com CorrelationId e SolicitacaoId via ContextVars
- Handler de arquivo rotativo (RotatingFileHandler) para persistência de logs de debug
- Context manager trace_execution para medição precisa de tempo (latency/duration_ms)
"""

import contextlib
import contextvars
from datetime import datetime, timezone
import json
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import sys
import time
from typing import Any, Generator, Optional

# ContextVar para propagação assíncrona segura do CorrelationId entre corrotinas
correlation_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id", default="")
solicitacao_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("solicitacao_id", default="")


def set_request_context(correlation_id: Optional[str] = None, solicitacao_id: Optional[str] = None) -> None:
    """Define o identificador de correlação e solicitação para o contexto assíncrono atual."""
    if correlation_id:
        correlation_id_ctx.set(correlation_id)
    if solicitacao_id:
        solicitacao_id_ctx.set(solicitacao_id)


def clear_request_context() -> None:
    """Limpa o contexto de correlação atual."""
    correlation_id_ctx.set("")
    solicitacao_id_ctx.set("")


class JSONFormatter(logging.Formatter):
    """
    Formatador de log estruturado em JSON para unificação com logs da API C# e ferramentas de APM.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage()
        }

        # Contexto de rastreamento assíncrono
        cid = correlation_id_ctx.get()
        if cid:
            log_entry["correlationId"] = cid

        sid = solicitacao_id_ctx.get()
        if sid:
            log_entry["solicitacaoId"] = sid

        # Atributos de contexto anexados dinamicamente via extra={}
        for field in [
            "restauranteId", "produtoId", "action",
            "duration_ms", "baseline_mae", "model_mae", "versao_modelo",
            "pontos_historico", "quantidade_prevista"
        ]:
            val = getattr(record, field, None)
            if val is not None:
                log_entry[field] = val

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False)


class ConsoleDebugFormatter(logging.Formatter):
    """
    Formatador otimizado para depuração em console/terminal durante o desenvolvimento.
    Destaca timestamp, nível, logger, correlationId e tempos de execução.
    """
    def format(self, record: logging.LogRecord) -> str:
        time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        cid = correlation_id_ctx.get()
        sid = solicitacao_id_ctx.get()

        context_parts = []
        if cid:
            context_parts.append(f"cid:{cid[:8]}")
        if sid:
            context_parts.append(f"req:{sid[:8]}")

        duration = getattr(record, "duration_ms", None)
        if duration is not None:
            context_parts.append(f"{duration:.1f}ms")

        action = getattr(record, "action", None)
        if action:
            context_parts.append(f"[{action}]")

        context_str = f" ({' | '.join(context_parts)})" if context_parts else ""
        msg = f"[{time_str}] [{record.levelname:<5}] [{record.name}]{context_str} {record.getMessage()}"

        if record.exc_info:
            msg += f"\n{self.formatException(record.exc_info)}"

        return msg


def configure_logging(
    level: str = "DEBUG",
    log_to_file: bool = True,
    log_file_path: str = "logs/ml_worker_debug.log",
    format_type: str = "console"
) -> None:
    """
    Configura o sistema de logs unificado com Handlers de Console e Arquivo Rotativo.
    """
    numeric_level = getattr(logging, level.upper(), logging.DEBUG)
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    root_logger.handlers.clear()

    # Formatter do console
    console_formatter = JSONFormatter() if format_type.lower() == "json" else ConsoleDebugFormatter()

    # 1. Console StreamHandler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # 2. RotatingFileHandler para persistência de depuração
    if log_to_file:
        try:
            file_path = Path(log_file_path)
            file_path.parent.mkdir(parents=True, exist_ok=True)

            file_handler = RotatingFileHandler(
                filename=str(file_path),
                maxBytes=10 * 1024 * 1024,  # 10 MB
                backupCount=5,
                encoding="utf-8"
            )
            file_handler.setLevel(numeric_level)
            file_handler.setFormatter(JSONFormatter())
            root_logger.addHandler(file_handler)
        except Exception as err:
            sys.stderr.write(f"[LOGGING_INIT_WARN] Não foi possível criar o arquivo de log: {err}\n")

    # Atenua logs excessivos de bibliotecas terceiras para manter o foco na depuração
    logging.getLogger("aiormq").setLevel(logging.INFO)
    logging.getLogger("aio_pika").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)


@contextlib.contextmanager
def trace_execution(action_name: str, logger: logging.Logger, **context_attrs: Any) -> Generator[None, None, None]:
    """
    Context manager para cronometrar e depurar blocos de código críticos.
    Registra início, tempo de execução final e eventuais exceções detalhadas.
    """
    start_time = time.perf_counter()
    logger.debug("Iniciando ação: %s", action_name, extra={"action": action_name, **context_attrs})
    try:
        yield
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.debug(
            "Ação concluída: %s em %.2fms",
            action_name,
            duration_ms,
            extra={"action": action_name, "duration_ms": duration_ms, **context_attrs}
        )
    except Exception as exc:
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.error(
            "Falha na ação: %s após %.2fms: %s",
            action_name,
            duration_ms,
            exc,
            exc_info=True,
            extra={"action": action_name, "duration_ms": duration_ms, **context_attrs}
        )
        raise
