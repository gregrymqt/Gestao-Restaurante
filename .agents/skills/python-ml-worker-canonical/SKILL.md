---
name: python-ml-worker-canonical
description: >-
  Manual canônico e diretrizes normativas para Machine Learning e Workers Assíncronos em Python 3.12,
  aio-pika, Pydantic V2, FastAPI Lifespan, Feature Engineering temporal e HistGradientBoosting.
  Ative esta skill ao desenvolver pipelines de features, inferências, consumers RabbitMQ ou rotinas de MLOps no Python.
---

# Diretrizes Canônicas de Machine Learning e Workers Assíncronos: Python 3.12

Esta skill estabelece os parâmetros normativos, convenções arquiteturais, restrições operacionais e padrões de MLOps para o desenvolvimento do microsserviço analítico em Python 3.12 (`ml/RestauranteInteligente.ML`) no projeto **Restaurante Inteligente**.

---

## 1. Cláusulas Inegociáveis de Invalidação de Código (Fail-Closed)

Qualquer código gerado que viole qualquer uma das seguintes cláusulas é **sumariamente inválido**:

1. **PROIBIDO Acesso a Banco de Dados Relacional:**
   - É **terminantemente vedado** importar ou utilizar bibliotecas de persistência ou drivers SQL (`asyncpg`, `psycopg`, `psycopg2`, `SQLAlchemy`, `tortoise-orm`, etc.) no código Python.
   - Todo e qualquer dado histórico de vendas, fechamento de caixa, fichas técnicas ou medições climáticas deve ser obtido exclusivamente através de mensagens JSON trafegadas via RabbitMQ a partir do backend C#.

2. **PROIBIDO Bloqueio Síncrono do Loop de Eventos (Event Loop):**
   - Operações computacionais pesadas de CPU (treinamento de regressões, transformações Pandas, inferências Scikit-Learn ou LightGBM) nunca devem rodar diretamente no loop assíncrono principal.
   - É mandatória a delegação dessas tarefas para threads separadas através de `asyncio.to_thread`.

3. **PROIBIDO Instanciação Dinâmica de Modelos no Callback:**
   - Modelos, pipelines de transformação e pesos pré-treinados devem ser carregados integralmente na memória volátil durante a rotina de inicialização (`lifespan startup`).
   - É proibida a leitura de arquivos em disco ou reinstanciação de modelos a cada mensagem consumida da fila.

4. **PROIBIDO Consumo com Confirmação Automática (Auto-Ack):**
   - O consumidor AMQP deve operar estritamente com `auto_ack=False`.
   - Mensagens não processadas ou rejeitadas devem emitir rejeição explícita com direcionamento obrigatório para Dead Letter Exchange (`dlx.restaurante`) e Dead Letter Queue (`queue:previsao_demanda_dlq`) com `requeue=False`.

5. **PROIBIDO Clientes Externos de Modelos de Linguagem (LLM):**
   - O microsserviço Python destina-se estritamente ao processamento de Machine Learning tabular (regressão e séries temporais).
   - Proibido o uso de bibliotecas como `langchain`, `openai`, `anthropic` ou `openrouter` dentro deste módulo.

6. **PROIBIDO Payloads Sem Validação Estrita:**
   - Toda mensagem recebida ou enviada deve ser serializada e validada por modelos Pydantic V2 configurados em modo rigoroso (`extra="forbid"`, `frozen=True`), garantindo descarte imediato de payloads malformados.

---

## 2. Topologia do Microsserviço

```
ml/RestauranteInteligente.ML/
├── app/
│   ├── main.py                  # FastAPI lifespan, startup pre-warming e /health
│   ├── core/
│   │   ├── config.py            # pydantic-settings e variáveis de ambiente
│   │   └── logging.py           # Logging estruturado em JSON com CorrelationId
│   ├── schemas/
│   │   └── messaging.py         # Schemas rigorosos Pydantic V2 (aliases camelCase)
│   ├── messaging/
│   │   └── consumer.py          # aio-pika resiliente, prefetch, DLX/DLQ
│   ├── preprocessing/
│   │   └── feature_pipeline.py  # Lags temporais, estatísticas móveis e projeções cíclicas
│   ├── models/
│   │   └── demand_model.py      # HistGradientBoosting, TimeSeriesSplit, asyncio.to_thread
│   └── services/
│       └── prediction_service.py # Orquestração de inferência, baseline e retreino
├── artifacts/                   # Modelos exportados (.joblib) e manifest.json
├── tests/                       # Unitários, schemas e benchmark de superioridade
├── requirements.txt             # Dependências com fixação estrita de versões (pinning)
└── Dockerfile                   # Imagem baseada em python:3.12-slim
```

Consulte [topology_and_requirements.md](./references/topology_and_requirements.md) para detalhes de empacotamento.

---

## 3. Padrões de Código e Referências Canônicas

### 3.1 Schemas e Validação Estrita (Pydantic V2)
- Herança de `ConfigDict(extra="forbid", frozen=True, populate_by_name=True)`.
- Mapeamento determinístico de aliases camelCase do C#.
- Veja a implementação em [pydantic_v2_schemas.py](./references/pydantic_v2_schemas.py).

### 3.2 Feature Engineering e Baseline Heurístico
- Janela mínima de 14 dias para treino/inferência completa com ML.
- Lags autorregressivos (`lag_1`, `lag_7`), médias e desvios móveis (`rolling_mean_7`, `rolling_std_7`), codificação trigonométrica cíclica do dia da semana (`sin_dia_semana`, `cos_dia_semana`) e variáveis exógenas (temperatura, precipitação, preço).
- **Fallback Gracioso para Histórico Curto:** se o histórico tiver entre 7 e 13 dias, adota a média móvel dos últimos 7 dias ($y_{\text{baseline}}$) com `modeloVersao: "baseline-heuristic-v1"`.
- Veja a implementação em [feature_engineering_pipeline.py](./references/feature_engineering_pipeline.py).

### 3.3 Motor de Machine Learning e TimeSeriesSplit
- Algoritmo: `HistGradientBoostingRegressor` (Scikit-Learn).
- Validação temporal cruzada com `TimeSeriesSplit(n_splits=5)` impedindo vazamento de dados futuros (*data leakage*).
- Inferência assíncrona desacoplada da thread principal via `asyncio.to_thread`.
- Versionamento semântico de artefatos com `joblib` e manifesto JSON de métricas.
- Veja a implementação em [demand_prediction_engine.py](./references/demand_prediction_engine.py).

### 3.4 Mensageria Resiliente com aio-pika
- Conexão robusta (`connect_robust`), controle de contrapressão com `prefetch_count=5..10`.
- Declaração de Dead Letter Exchange (`dlx.restaurante`) e Queue (`queue:previsao_demanda_dlq`).
- Consumo de `queue:previsao_demanda_solicitada` e publicação do resultado na fila de retorno `queue:previsao_consolidada_csharp`.
- Veja a implementação em [rabbitmq_consumer.py](./references/rabbitmq_consumer.py).

### 3.5 Ciclo de Vida com FastAPI Lifespan
- `carregar_modelo()` pré-aquecendo pesos na memória volátil antes de iniciar escuta AMQP.
- Parada cooperativa no encerramento da aplicação.
- Endpoint de monitoramento `/health`.
- Veja a implementação em [fastapi_lifespan_main.py](./references/fastapi_lifespan_main.py).

### 3.6 Observabilidade e Logging Estruturado
- Formato de log JSON contendo `timestamp`, `level`, `correlationId`, `restauranteId`, `action`, `duration_ms` e métricas estatísticas de MAE.
- Veja a implementação em [structured_logging.py](./references/structured_logging.py).

---

## 4. Critérios de Aceitação e Homologação (CI)

1. **Tipagem Estrita:**
   ```bash
   mypy app/ --strict
   ```
2. **Linting e Formatação:**
   ```bash
   ruff check app/ && ruff format --check app/
   ```
3. **Cobertura de Testes:**
   ```bash
   pytest tests/unit -v --cov=app # Cobertura mínima de 85%
   ```
4. **Superioridade Obrigatória do Modelo:**
   ```bash
   pytest tests/eval/test_baseline_benchmark.py # Valida MAE_modelo < MAE_baseline
   ```
