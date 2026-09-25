# ==============================================================================
# Manual Canónico de Machine Learning: Python 3.12
# Logging Estruturado em JSON com Correlação End-to-End
# ==============================================================================

from datetime import datetime, timezone
import json
import logging
from typing import Any


class JSONFormatter(logging.Formatter):
    """
    Formatador de log estruturado em JSON para unificação com logs da API C#.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage()
        }

        # Extrai atributos de contexto anexados dinamicamente via extra={}
        for field in [
            "correlationId", "restauranteId", "action", 
            "duration_ms", "baseline_mae", "model_mae", "versao_modelo"
        ]:
            val = getattr(record, field, None)
            if val is not None:
                log_entry[field] = val

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False)


def setup_structured_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [handler]
