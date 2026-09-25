# Topologia do Microsserviço e Dependências (Python 3.12)

## Estrutura Física de Diretórios

```
ml/RestauranteInteligente.ML/
├── app/
│   ├── __init__.py
│   ├── main.py                          # Ponto de entrada, FastAPI Lifespan e /health
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                    # Configurações com pydantic-settings
│   │   └── logging.py                   # Logger JSON estruturado
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── messaging.py                 # Schemas rigorosos Pydantic V2 (aliases camelCase)
│   ├── messaging/
│   │   ├── __init__.py
│   │   └── consumer.py                  # Consumidor assíncrono aio-pika com DLX/DLQ
│   ├── preprocessing/
│   │   ├── __init__.py
│   │   └── feature_pipeline.py          # Extração de lags, rolling stats e variáveis exógenas
│   ├── models/
│   │   ├── __init__.py
│   │   └── demand_model.py              # HistGradientBoosting, TimeSeriesSplit e asyncio.to_thread
│   └── services/
│       ├── __init__.py
│       └── prediction_service.py        # Orquestrador de predição com fallback para baseline
├── artifacts/
│   ├── models/                          # demand_regressor_v1.0.0.joblib
│   ├── demand_regressor_latest.joblib   # Modelo atualmente ativo
│   └── manifest.json                    # Histórico e parâmetros de treinamento
├── tests/
│   ├── unit/                            # Testes de unidade e schemas
│   └── eval/                            # Benchmark de superioridade estatística
├── requirements.txt                     # Fixação estrita de versões (pinning)
└── Dockerfile                           # Imagem Docker multi-stage python:3.12-slim
```

---

## Manifesto de Dependências (`requirements.txt`)

```text
# Servidor Web e Async Runtime
fastapi==0.115.0
uvicorn[standard]==0.31.0
pydantic==2.9.2
pydantic-settings==2.5.2

# Mensageria Assíncrona
aio-pika==9.4.3

# Computação Numérica e Machine Learning
numpy==2.1.1
pandas==2.2.3
scikit-learn==1.5.2
joblib==1.4.2

# Qualidade, Tipagem e Testes
mypy==1.11.2
ruff==0.6.8
pytest==8.3.3
pytest-asyncio==0.24.0
pytest-cov==5.0.0
```

---

## Especificação do Dockerfile (`Dockerfile`)

```dockerfile
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Criação de usuário não-root por segurança
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
