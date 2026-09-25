---
name: postgres-canonical
description: >-
  Manual canônico e diretrizes normativas para PostgreSQL 16, Entity Framework Core (.NET 8/9)
  e segregação física de persistência do worker Python no sistema Restaurante Inteligente.
  Ative esta skill ao modelar entidades, escrever queries, criar migrations, manipular estoque,
  configurar Docker/WAL ou integrar mensageria de ML com persistência.
---

# Diretrizes Canônicas de Persistência: PostgreSQL 16 para Restaurante Inteligente

Esta skill governa todas as convenções de modelagem, mecanismos de concorrência, infraestrutura e limites arquiteturais para o banco de dados PostgreSQL 16 e o Entity Framework Core no projeto **Restaurante Inteligente**.

---

## 1. Cláusulas de Invalidação Imediata de Código (Guardrails Inegociáveis)

Qualquer código gerado que viole qualquer uma das seguintes cláusulas é **completamente inválido**:

1. **Vazamento Multi-Tenant:**
   - É terminantemente proibida qualquer consulta LINQ, comando SQL cru (`FromSqlRaw`) ou operação DML sem o filtro explícito ou automático por `RestauranteId`.
   - Todas as entidades no escopo do restaurante devem implementar a interface `IRestauranteEntity`.

2. **Segregação Física do Worker Python:**
   - É **categoricamente vedada** a inclusão de bibliotecas de conexão a bancos relacionais (`asyncpg`, `psycopg2`, `SQLAlchemy`, etc.) no código-fonte do worker Python.
   - O worker comunica-se exclusivamente via RabbitMQ. A ingestão de séries históricas e a persistência final de previsões na tabela `Previsoes` são mediadas unicamente pela API C# (.NET).

3. **Proibição de Ponto Flutuante:**
   - Proibido o uso de `float`, `double` ou `real` para valores monetários ou estoques fracionados.
   - Usar estritamente `numeric(18,2)` para valores monetários e `numeric(18,4)` para quantidades de insumos. No C#, usar sempre `decimal`.

4. **Imutabilidade do Ledger de Estoque (*Append-Only*):**
   - A tabela `MovimentacoesEstoque` nunca recebe `UPDATE` ou `DELETE`.
   - Ajustes de discrepâncias físicas devem ser efetuados exclusivamente mediante inserção de novos lançamentos compensatórios (`Tipo = 'AJUSTE'`).

5. **Ordenação Mandatória Anti-Deadlock:**
   - É proibido realizar bloqueio pessimista ou reserva de insumos sem antes agrupar e ordenar os identificadores em ordem ascendente (`InsumoId ASC`) no código da aplicação.

6. **Normalização Temporal UTC:**
   - Todas as colunas de data/hora no banco devem ser `TIMESTAMPTZ` e manipuladas como `DateTimeOffset` em UTC na aplicação.

---

## 2. Arquitetura Multi-Tenant em Dupla Camada

O sistema adota o padrão **Shared Database, Shared Schema** com proteção em profundidade:

### Camada 1: Entity Framework Core (Aplicação)
- Em `OnModelCreating`, toda entidade derivada de `IRestauranteEntity` recebe um Global Query Filter:
  ```csharp
  modelBuilder.Entity<T>().HasQueryFilter(e => e.RestauranteId == _tenantContext.RestauranteId);
  ```

### Camada 2: PostgreSQL Row-Level Security (RLS no Banco)
- Tabelas operacionais possuem RLS habilitado com `FORCE ROW LEVEL SECURITY`.
- Para acionar o RLS nativo sem contaminar o pool de conexões do Npgsql, um `DbTransactionInterceptor` executa `SET LOCAL app.current_restaurante_id = '{tenantId}'` no início de cada transação.
- Veja a implementação canônica em [ef_core_rls_interceptor.cs](./references/ef_core_rls_interceptor.cs).

---

## 3. Concorrência e Baixa Transacional de Estoque

A baixa de insumos compõe a ficha técnica (BOM) e exige disciplina estrita para evitar deadlocks e inconsistências em horários de pico.

1. **Procedimento Canônico:**
   - Agrupar insumos necessários da venda.
   - Ordenar `InsumoId ASC`.
   - Abrir transação explícita `IDbContextTransaction`.
   - Bloquear com `SELECT * FROM "Insumos" WHERE "Id" = ANY(@ids) ORDER BY "Id" FOR UPDATE`.
   - Validar saldo disponível de cada insumo.
   - Atualizar `QuantidadeEstoque` (visão materializada).
   - Inserir lançamento imutável em `MovimentacoesEstoque` com `Origem = OrigemMovimentacao.Venda`.
   - Comitar a transação.
2. Veja o código de referência completo em [ef_core_concurrency.cs](./references/ef_core_concurrency.cs).

---

## 4. Concorrência Otimista com `xmin`

Para cadastros administrativos (`Produtos`, `Insumos`), utiliza-se o token nativo do PostgreSQL `xmin`:
```csharp
builder.Property<uint>("xmin")
       .HasColumnType("xid")
       .ValueGeneratedOnAddOrUpdate()
       .IsConcurrencyToken();
```
Conflitos concorrentes disparam `DbUpdateConcurrencyException`, tratada com repetição ou aviso ao usuário.

---

## 5. Esquema Relacional e Migrações

- O DDL canônico formal de todas as 11 tabelas, índices colocalizados e políticas RLS encontra-se em [ddl_schema.sql](./references/ddl_schema.sql).
- As migrações devem ser geradas em arquivos SQL idempotentes e determinísticos via:
  ```bash
  dotnet ef migrations script --idempotent \
    --project src/RestauranteInteligente.Infrastructure \
    --startup-project src/RestauranteInteligente.Api \
    --output ./migrations/deploy_database.sql
  ```
- **Proibido** executar `context.Database.Migrate()` na inicialização do serviço em produção.

---

## 6. Infraestrutura de Contêiner e Armazenamento WAL

- O PostgreSQL 16 opera em contêiner segregando o WAL (`POSTGRES_INITDB_WALDIR`) em volume dedicado para eliminar contenção com escritas de dados.
- Checksums ativados com `--data-checksums`.
- Parâmetros de memória calibrados para teto de 3 GB de RAM (`shared_buffers=768MB`, `work_mem=16MB`, `pg_stat_statements`).
- Veja a definição completa do serviço em [docker-compose.postgres.yml](./references/docker-compose.postgres.yml).
- A rotina de backup lógico comprimido diário com retenção de 48 horas encontra-se em [backup_restore.sh](./references/backup_restore.sh).
