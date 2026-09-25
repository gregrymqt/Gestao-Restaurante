# Topologia da Solution e Matriz de Camadas (.NET 9 / C# 13)

## Estrutura Física de Diretórios

```
Gestao-Restaurante/
├── src/
│   ├── RestauranteInteligente.Domain/
│   │   ├── Common/               # IRestauranteEntity, BaseEntity, ValueObjects
│   │   ├── Entities/             # Restaurante, Produto, Insumo, ProdutoInsumo, Venda, etc.
│   │   ├── Enums/                # TipoMovimentacao, OrigemMovimentacao, StatusCaixa
│   │   └── Exceptions/           # DomainValidationException, EstoqueInsuficienteException
│   │
│   ├── RestauranteInteligente.Application/
│   │   ├── Common/
│   │   │   ├── Interfaces/       # IAppDbContext, IEventBus, ICurrentTenantProvider
│   │   │   └── Models/           # PagedResult<T>, CursorPaginationRequest
│   │   ├── Contracts/
│   │   │   └── Messaging/        # PrevisaoDemandaSolicitadaEvent, etc.
│   │   └── UseCases/
│   │       ├── Vendas/           # RegistrarVendaCommand, RegistrarVendaCommandHandler
│   │       └── Insumos/          # ObterHistoricoMovimentacoesQuery
│   │
│   ├── RestauranteInteligente.Infrastructure/
│   │   ├── Persistence/          # AppDbContext, Configurations, Migrations
│   │   ├── Security/             # CurrentTenantProvider
│   │   ├── Messaging/            # EventBus (MassTransit wrapper), Consumers
│   │   └── Integrations/         # WeatherClient (Microsoft.Extensions.Http.Resilience)
│   │
│   └── RestauranteInteligente.Api/
│       ├── Controllers/          # VendasController, InsumosController, PrevisoesController
│       ├── Middlewares/          # ExceptionMiddleware (RFC 7807), TenantContextMiddleware
│       ├── Extensions/           # ServiceCollectionExtensions (DI modular)
│       └── Program.cs            # Clean Bootstrapping
│
├── tests/
│   ├── RestauranteInteligente.UnitTests/         # Testes de unidade de regras de negócio
│   └── RestauranteInteligente.IntegrationTests/  # Testes de integração de endpoints e banco
│
├── ml/
│   └── RestauranteInteligente.ML/               # Worker Python (aio-pika, sem libs relacionais)
│
└── docker-compose.yml                            # Postgres, RabbitMQ, API, ML Worker
```

---

## Matriz de Dependências e Proibições

| Projeto | Dependências Permitidas | Proibições Absolutas |
| :--- | :--- | :--- |
| **Domain** | Nenhuma | Referência a EF Core, Data Annotations, I/O, Web, Newtonsoft/System.Text.Json |
| **Application** | `Domain` | Referência a implementações concretas de Infrastructure, DbContext ou Controllers |
| **Infrastructure** | `Application`, `Domain` | Regras de validação do domínio ou manipulação direta de rotas HTTP |
| **Api** | `Application`, `Infrastructure` | Comandos SQL diretos, bypass de handlers de aplicação ou regras fiscais/contábeis em controllers |

---

## Critérios de Qualidade e Linhas de Verificação de CI

| Verificação | Comando | Critério de Aceitação |
| :--- | :--- | :--- |
| **Compilação Estrita** | `dotnet build src/RestauranteInteligente.Api -c Release --warnaserror` | Zero erros e zero avisos (*warnings*) |
| **Testes Unitários** | `dotnet test tests/RestauranteInteligente.UnitTests` | 100% de aprovação nos testes de invariantes e BOM |
| **Formatação Estrita** | `dotnet format --verify-no-changes` | Nenhuma divergência de estilo ou linting |
