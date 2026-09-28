import os
import pytest
from pydantic import ValidationError
from app.core.config import Settings


def test_settings_failfast_when_missing_required_env_vars(monkeypatch):
    """
    Valida a cláusula estrita Fail-Fast: Se as credenciais obrigatórias não estiverem presentes,
    o Pydantic deve disparar ValidationError imediatamente, impedindo a subida do Worker.
    """
    # Remove variáveis obrigatórias do ambiente e aponta para arquivo inexistente
    monkeypatch.delenv("REDIS_PASSWORD", raising=False)
    monkeypatch.delenv("RABBITMQ_PASSWORD", raising=False)
    monkeypatch.delenv("RABBITMQ_USER", raising=False)
    monkeypatch.delenv("REDIS_HOST", raising=False)
    monkeypatch.delenv("RABBITMQ_HOST", raising=False)

    class StrictSettings(Settings):
        model_config = {
            "env_file": "non_existent_env_file_path.env",
            "extra": "ignore"
        }

    with pytest.raises(ValidationError) as exc_info:
        StrictSettings()

    errors = exc_info.value.errors()
    missing_fields = {err["loc"][0] for err in errors if err["type"] == "missing"}

    assert "REDIS_PASSWORD" in missing_fields
    assert "RABBITMQ_PASSWORD" in missing_fields
    assert "RABBITMQ_USER" in missing_fields
    assert "REDIS_HOST" in missing_fields
    assert "RABBITMQ_HOST" in missing_fields
