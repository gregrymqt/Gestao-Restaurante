# Topologia e Grafo de Conhecimento - Restaurante Inteligente

> **Sumário Executivo para Agentes de IA**: Este documento consolida a arquitetura física e lógica
> do monorepo, mapeando fluxos críticos, contratos de mensageria, segurança RLS e rotas consumidas.
> Consulte este índice antes de explorar diretórios cegamente.

## 1. Métricas do Grafo de Conhecimento

- **Total de Nós Mapeados**: `91`
- **Total de Arestas Semânticas**: `136`

### Distribuição por Tipo de Nó
| Tipo de Nó | Quantidade | Descrição / Camada |
| :--- | :---: | :--- |
| `FrontendHook` | 14 | Hooks de orquestração de estado e UI |
| `DatabaseTable` | 11 | Tabelas PostgreSQL 16 (Ledger, Vendas, RLS) |
| `SecurityPolicy` | 11 | Políticas RLS nativas e Interceptor C# |
| `CoreRepository` | 7 | Repositórios de persistência EF Core |
| `ApiController` | 7 | Controllers ASP.NET Core (.NET 9) |
| `FrontendService` | 7 | Camada de rede e transporte (Axios/MMKV) |
| `FrontendPage` | 7 | Telas e rotas nativas expo-router |
| `FrontendFeature` | 6 | Bounded Contexts (Feature-First) |
| `UseCase` | 5 | Regras de negócio e handlers (Application) |
| `DockerContainer` | 5 | Serviços locais no docker-compose.yml |
| `RedisService` | 4 | Cache, Distributed Lock, Streams e Rate Limit |
| `MessageQueue` | 3 | Filas e Exchanges RabbitMQ (Raw JSON) |
| `MassTransitConsumer` | 1 | Consumidores assíncronos RabbitMQ no C# |
| `FastAPIService` | 1 | API Python ML Worker (Health/Liveness) |
| `PythonWorker` | 1 | Worker assíncrono aio-pika (Zero SQL) |
| `MLPipeline` | 1 | Modelo Scikit-Learn HistGradientBoosting |

---

## 2. Matriz de Fluxos Críticos de Ponta a Ponta

### Fluxo 1: Venda PDV -> Baixa BOM Pessimista -> Alerta SSE
1. **Trigger**: Operador confirma venda no terminal mobile (`useRegistrarVenda` -> `vendasService.ts`).
2. **Transporte**: `POST /api/v1/vendas` atendido por `VendasController.RegistrarVenda`.
3. **Orquestração**: `RegistrarVendaUseCase` abre transação explícita (`IDbContextTransaction`).
4. **Disciplina Anti-Deadlock**: `BaixaEstoqueService` expande itens da ficha técnica (BOM), agrupa por insumo e ordena por `InsumoId ASC` antes de `SELECT ... FOR UPDATE`.
5. **Ledger Imutável**: Grava em `Vendas`, `ItensVenda` e insere registros append-only em `MovimentacoesEstoque` (`Tipo = 'SAIDA_VENDA'`). Atualiza saldo em `Insumos`.
6. **Streaming**: Se saldo < estoque mínimo, publica em canal Redis Stream. `EventsController` transmite evento `EstoqueCritico` via SSE para `useRealtimeEvents` no mobile.

### Fluxo 2: Fechamento de Caixa -> RabbitMQ -> ML Worker -> Predição
1. **Trigger**: Fechamento do turno no mobile (`useFecharCaixa` -> `caixaService.ts`).
2. **Transporte**: `POST /api/v1/caixa/fechar` atendido por `FechamentosController.FecharCaixa`.
3. **Transação**: `FecharCaixaUseCase` consolida valores, fecha caixa e publica `PrevisaoDemandaSolicitadaEvent_v1` no RabbitMQ (`previsao.demanda.solicitada`).
4. **Worker Python (Zero-SQL)**: `RabbitConsumer` (`aio-pika`) consome a mensagem com confirmação manual (`manual ack`), computa lags temporais e executa inferência (`HistGradientBoostingRegressor`).
5. **Retorno Assíncrono**: Publica predição em `previsao.demanda.concluida`. Em caso de erro irrecuperável, envia à `dlq.previsao.demanda.solicitada`.
6. **Persistência Segura**: `PrevisaoDemandaConcluidaConsumer` (.NET) consome evento e executa upsert em `Previsoes` sob o contexto RLS do restaurante.

---

## 3. Topologia de Mensageria e Streaming

```mermaid
flowchart LR
    subgraph DotNet [Backend C# .NET 9]
        FC[FecharCaixaUseCase] -->|Pub Raw JSON| EX_SOL[previsao.demanda.solicitada]
        CONS_NET[PrevisaoDemandaConcluidaConsumer] -->|Upsert RLS| DB[(PostgreSQL)]
        EVT_CTRL[EventsController SSE] -->|Stream| SSE_CLI[Mobile useRealtimeEvents]
    end
    subgraph RabbitMQ [RabbitMQ Topology]
        EX_SOL --> Q_SOL[Fila Solicitada]
        EX_SOL -.->|Erro / Nack| DLQ[dlq.previsao.demanda.solicitada]
        Q_CONC[previsao.demanda.concluida] --> CONS_NET
    end
    subgraph PythonML [Worker Python 3.12 (Zero-SQL)]
        Q_SOL --> PY_WORKER[RabbitConsumer aio-pika]
        PY_WORKER --> ML_ENG[HistGradientBoosting]
        ML_ENG -->|Pub Raw JSON| Q_CONC
    end
```

---

## 4. Catálogo de Conexão Frontend vs Controllers C#

| Feature Mobile | Service Frontend | Endpoint C# / Rota | Verbo | Controller C# |
| :--- | :--- | :--- | :---: | :--- |
| `auth` | `authService` | `/auth/login` | **POST** | `AuthController` |
| `auth` | `authService` | `/auth/tenants` | **GET** | `AuthController` |
| `caixa` | `caixaService` | `/caixa/fechar` | **POST** | `FechamentosController` |
| `estoque` | `estoqueService` | `/estoque/entrada` | **POST** | `EstoqueController` |
| `estoque` | `estoqueService` | `/estoque/fichas-tecnicas` | **GET** | `EstoqueController` |
| `estoque` | `estoqueService` | `/estoque/insumos` | **GET** | `EstoqueController` |
| `estoque` | `estoqueService` | `/estoque/insumos` | **POST** | `EstoqueController` |
| `previsoes` | `previsoesService` | `/previsoes/capacidade` | **GET** | `PrevisoesController` |
| `vendas` | `vendasService` | `/produtos` | **GET** | `ProdutosController` |
| `vendas` | `vendasService` | `/produtos` | **POST** | `ProdutosController` |
| `vendas` | `vendasService` | `/vendas` | **POST** | `VendasController` |

---

## 5. Diretrizes de Navegação Fail-Closed para Agentes

1. **Segregação do Python**: Jamais sugira ou escreva `import psycopg2/asyncpg/sqlalchemy` no Worker Python. O Python comunica-se exclusivamente via AMQP (`aio-pika`).
2. **Multi-Tenancy Obrigatório**: Qualquer nova entidade deve implementar `IRestauranteEntity` e ser registrada com `HasQueryFilter` e política RLS correspondente.
3. **Estoque Append-Only**: Nunca gere comandos de `UPDATE` ou `DELETE` na tabela `MovimentacoesEstoque`.
4. **Mobile Native First**: Toda UI mobile deve adotar estritamente `expo-router` e subcomponentes modulares com teto de 350 linhas por arquivo `.tsx`.

*(Relatório gerado automaticamente por `.agents/scripts/generate_knowledge_graph.py`)*