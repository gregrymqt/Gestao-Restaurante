import json
import logging
import pytest
from app.core.logging import (
    JSONFormatter,
    ConsoleDebugFormatter,
    configure_logging,
    set_request_context,
    clear_request_context,
    trace_execution
)


def test_json_formatter_produces_valid_json_with_metadata():
    formatter = JSONFormatter()
    logger = logging.getLogger("test.logger")

    set_request_context(correlation_id="corr-12345", solicitacao_id="req-67890")

    try:
        record = logger.makeRecord(
            name="test.logger",
            level=logging.DEBUG,
            fn="test_logging.py",
            lno=10,
            msg="Mensagem de teste de depuração",
            args=(),
            exc_info=None,
            extra={"action": "teste_unitario", "duration_ms": 42.5, "produtoId": "prod-1"}
        )

        formatted_str = formatter.format(record)
        data = json.loads(formatted_str)

        assert data["level"] == "DEBUG"
        assert data["logger"] == "test.logger"
        assert data["message"] == "Mensagem de teste de depuração"
        assert data["correlationId"] == "corr-12345"
        assert data["solicitacaoId"] == "req-67890"
        assert data["action"] == "teste_unitario"
        assert data["duration_ms"] == 42.5
        assert data["produtoId"] == "prod-1"
        assert "timestamp" in data
    finally:
        clear_request_context()


def test_console_debug_formatter_formats_readable_string():
    formatter = ConsoleDebugFormatter()
    logger = logging.getLogger("test.console")

    set_request_context(correlation_id="corr-abcdef123", solicitacao_id="req-987654321")

    try:
        record = logger.makeRecord(
            name="test.console",
            level=logging.INFO,
            fn="test_logging.py",
            lno=20,
            msg="Operação em console",
            args=(),
            exc_info=None,
            extra={"action": "execucao_console", "duration_ms": 15.2}
        )

        output = formatter.format(record)
        assert "[INFO ]" in output
        assert "[test.console]" in output
        assert "cid:corr-abc" in output
        assert "req:req-987" in output
        assert "15.2ms" in output
        assert "Operação em console" in output
    finally:
        clear_request_context()


def test_trace_execution_measures_time_and_logs(caplog):
    caplog.set_level(logging.DEBUG)
    test_logger = logging.getLogger("test.trace")

    with trace_execution("acao_de_teste", test_logger, extra_info="teste"):
        # Executa operação simulada
        _ = sum(range(100))

    messages = [rec.message for rec in caplog.records if rec.name == "test.trace"]
    assert any("Iniciando ação: acao_de_teste" in m for m in messages)
    assert any("Ação concluída: acao_de_teste" in m for m in messages)


def test_trace_execution_propagates_exception_and_logs_error(caplog):
    caplog.set_level(logging.DEBUG)
    test_logger = logging.getLogger("test.trace.error")

    with pytest.raises(ValueError) as exc_info:
        with trace_execution("acao_com_falha", test_logger):
            raise ValueError("Erro intencional para teste de log")

    assert "Erro intencional" in str(exc_info.value)
    error_records = [rec for rec in caplog.records if rec.levelno == logging.ERROR]
    assert len(error_records) >= 1
    assert "Falha na ação: acao_com_falha" in error_records[0].message


def test_configure_logging_creates_rotating_file_handler(tmp_path):
    log_file = tmp_path / "test_debug.log"
    configure_logging(level="DEBUG", log_to_file=True, log_file_path=str(log_file), format_type="json")

    test_logger = logging.getLogger("test.file.logger")
    test_logger.debug("Mensagem gravada no arquivo rotativo de debug", extra={"action": "teste_arquivo_rotativo"})

    # Flush de todos os handlers
    for h in logging.getLogger().handlers:
        h.flush()
        if hasattr(h, "close"):
            h.close()

    assert log_file.exists()
    content = log_file.read_text(encoding="utf-8")
    assert "Mensagem gravada no arquivo rotativo de debug" in content
    assert "teste_arquivo_rotativo" in content
