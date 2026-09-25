---
name: dotnet-backend-canonical
description: >-
  Manual canônico e diretrizes normativas para Backend ASP.NET Core (.NET 9 / C# 13),
  Clean Architecture, DDD, MassTransit Raw JSON, concorrência, resiliência HTTP e RFC 7807.
  Ative esta skill ao desenvolver endpoints, use cases, domain entities, consumers RabbitMQ,
  middlewares ou configurações de DI no C#.
---

# Diretrizes Canônicas de Backend: ASP.NET Core (.NET 9) para Restaurante Inteligente

Esta skill estabelece os parâmetros normativos, convenções arquiteturais, padrões de resiliência e restrições de código para o desenvolvimento do backend em .NET 9 (C# 13) no projeto **Restaurante Inteligente**.

---

## 1. Cláusulas Inegociáveis de Invalidação de Código

Qualquer código gerado que viole qualquer uma destas cláusulas é **sumariamente inválido**:

1. **Soberania Absoluta do Domínio:**
   - O projeto `RestauranteInteligente.Domain` não referencia nenhum outro projeto ou pacote externo.
   - Proibida qualquer dependência de Entity Framework Core, atributos de persistência (*Data Annotations*) ou chamadas de I/O dentro do Domínio.
   - Entidades devem ser ricas (setters privados) com mutações protegidas por métodos de negócio que validem invariantes.

2. **Segregação de Multi-Tenancy em Camadas:**
   - Toda entidade dependente de inquilino deve assinar `IRestauranteEntity`.
   - As consultas LINQ são filtradas automaticamente via Global Query Filters em `OnModelCreating`.
   - O `SaveChangesAsync` deve validar e injetar o `RestauranteId`: se vazio, preenche com o inquilino autenticado; se preenchido com um ID divergente da sessão ativa, deve obrigatoriamente disparar `UnauthorizedAccessException`.

3. **Serialização Raw JSON no MassTransit:**
   - É mandatória a instrução `bus.UseRawJsonSerializer()` na configuração do RabbitMQ.
   - Proibido o uso dos envelopes proprietários do MassTransit que contenham metadados abstratos do .NET, preservando a interoperabilidade direta com modelos Pydantic no Worker Python.

4. **Baixa Transacional Ordenada Anti-Deadlock:**
   - Toda baixa de insumos deve expandir a ficha técnica (BOM), agrupar totais por insumo e ordenar deterministicamente por `InsumoId ASC` antes de emitir qualquer instrução pessimista `SELECT ... FOR UPDATE` via `FromSqlRaw`.

5. **Banimento de Sync-Over-Async:**
   - Proibido o bloqueio síncrono sobre tarefas assíncronas (`.Result`, `.Wait()`). Toda a pilha de execução deve propagar cooperativamente `CancellationToken` em operações não-bloqueantes.

6. **Keyset Pagination Obrigatória em Grandes Volumes:**
   - Proibido o uso de `Skip().Take()` em tabelas volumosas de auditoria/histórico (`MovimentacoesEstoque`). É mandatório o uso de Keyset Pagination sobre `(DataHora, Id)`.

---

## 2. Topologia da Solution e Matriz de Dependências

```
src/
├── RestauranteInteligente.Domain/            # Entidades ricas, Value Objects, Enums, Exceptions (0 dependências)
├── RestauranteInteligente.Application/       # Casos de uso (CQRS/MediatR), DTOs, FluentValidation, Interfaces
├── RestauranteInteligente.Infrastructure/    # EF Core (AppDbContext), MassTransit, Clientes HTTP, Repositórios
└── RestauranteInteligente.Api/               # Controllers REST, Middlewares, Clean Bootstrapping (Program.cs)
tests/
├── RestauranteInteligente.UnitTests/         # Testes unitários de domínio e regras de BOM
└── RestauranteInteligente.IntegrationTests/  # Testes de integração de banco e mensageria
```

Consulte [solution_topology.md](./references/solution_topology.md) para detalhes de organização e regras de CI.

---

## 3. Padrões de Código e Referências Canônicas

### 3.1 Modelagem de Domínio Rico
- Entidades possuem propriedades com `private set` e construtores validadores.
- Exceções de negócio explícitas: `DomainValidationException` e `EstoqueInsuficienteException`.
- Veja a implementação em [rich_domain_models.cs](./references/rich_domain_models.cs).

### 3.2 Persistência e Multi-Tenancy no EF Core
- `AppDbContext` configurado com `AddDbContextPool` e `QueryTrackingBehavior.NoTracking` por padrão.
- Global Query Filter configurado dinamicamente para toda entidade `IRestauranteEntity`.
- Interceptação de gravação com validação estrita anti-cross-tenant.
- Veja a implementação em [app_dbcontext_multitenant.cs](./references/app_dbcontext_multitenant.cs).

### 3.3 Orquestração Transacional de Venda e Estoque
- `RegistrarVendaCommandHandler` encapsula a transação dentro de `IExecutionStrategy`.
- Ordenação determinística de insumos `InsumoId ASC` seguida de `SELECT ... FOR UPDATE` pessimista.
- Atualização atômica do saldo e emissão do ledger `MovimentacoesEstoque`.
- Publicação assíncrona desacoplada via `IEventBus`.
- Veja a implementação em [registrar_venda_handler.cs](./references/registrar_venda_handler.cs).

### 3.4 Mensageria com MassTransit Raw JSON
- Configuração do barramento com `bus.UseRawJsonSerializer()`.
- Filas com políticas de retentativa exponencial e dead-lettering.
- Contratos tipados imutáveis (`record`).
- Veja a implementação em [masstransit_raw_rabbitmq.cs](./references/masstransit_raw_rabbitmq.cs).

### 3.5 Keyset Pagination na API
- Paginação baseada em cursor sobre o par ordenado `(DataHora, Id)`.
- Resposta encapsulada em `PagedResult<T>` com cursor Base64 opaco e boolean `HasMore`.
- Veja a implementação em [keyset_pagination_example.cs](./references/keyset_pagination_example.cs).

### 3.6 Resiliência HTTP Externa
- Integração de serviços meteorológicos protegida por `Microsoft.Extensions.Http.Resilience` (Polly v8): RateLimiter, Timeout global (30s), Retry exponencial com Jitter, CircuitBreaker e AttemptTimeout (5s).
- Veja a implementação em [http_resilience_weather.cs](./references/http_resilience_weather.cs).

### 3.7 Tratamento Global de Falhas (RFC 7807)
- `ExceptionMiddleware` interceptando exceções de negócio e infraestrutura, retornando `application/problem+json` com `correlationId`.
- Veja a implementação em [exception_middleware_rfc7807.cs](./references/exception_middleware_rfc7807.cs).

---

## 4. Critérios de Aceitação e Inspeção de Código (CI)

1. **Compilação Estrita:**
   ```bash
   dotnet build src/RestauranteInteligente.Api -c Release --warnaserror
   ```
2. **Testes Unitários:**
   ```bash
   dotnet test tests/RestauranteInteligente.UnitTests
   ```
3. **Formatação de Código:**
   ```bash
   dotnet format --verify-no-changes
   ```
