# Plano Atual: Transacionalidade Real (Caixa, Perfil e Previsões)

Status: Concluído
Data: 2026-11-21

## 1. Contexto e Invariantes
- Substituição integral de dados e transações mockadas nos fluxos de Caixa, Perfil e Previsões.
- Obediência estrita às Cláusulas de AGENTS.md:
  - Multi-tenant com `RestauranteId` e RLS no PostgreSQL.
  - Tipos `numeric(18,2)` para moeda, `numeric(18,4)` para insumos e `timestamptz` para datas em UTC.
  - Controllers chamam Use Cases/Handlers; Controllers nunca injetam `DbContext`.
  - Frontend desacoplado via Feature-First e `apiClient`.

---

## 2. Tarefas Atômicas de Execução

### Lote 1: Domínio e Persistência Backend C# (.NET 9)
- [x] Criar entidade `MovimentacaoCaixa.cs` em `src/RestauranteInteligente.Domain/Entities/MovimentacaoCaixa.cs` (IRestauranteEntity, Tipo: SUPRIMENTO/SANGRIA, Valor, Motivo, DataHora).
- [x] Criar entidades `OrdemCompra.cs` e `ItemOrdemCompra.cs` em `src/RestauranteInteligente.Domain/Entities/OrdemCompra.cs` (IRestauranteEntity, Protocolo, Status: PENDENTE, Itens, ValorTotal).
- [x] Atualizar interface `IFechamentoCaixaRepository.cs` em `src/RestauranteInteligente.Domain/Common/Interfaces/IFechamentoCaixaRepository.cs:L8-L13` adicionando métodos para movimentações.
- [x] Criar interface `IOrdemCompraRepository.cs` em `src/RestauranteInteligente.Domain/Common/Interfaces/IOrdemCompraRepository.cs`.
- [x] Atualizar `AppDbContext.cs` em `src/RestauranteInteligente.Infrastructure/Persistence/AppDbContext.cs:L40-L48` adicionando `DbSet<MovimentacaoCaixa>` e `DbSet<OrdemCompra>`.
- [x] Criar mapeamentos EF Core `MovimentacaoCaixaConfiguration.cs` e `OrdemCompraConfiguration.cs` em `src/RestauranteInteligente.Infrastructure/Persistence/Configurations/`.
- [x] Implementar repositórios `FechamentoCaixaRepository.cs` (`src/RestauranteInteligente.Infrastructure/Persistence/Repositories/FechamentoCaixaRepository.cs`) e `OrdemCompraRepository.cs`.

### Lote 2: Use Cases e Endpoints Backend C# (.NET 9)
- [x] Criar DTOs de movimentação e resumo em `src/RestauranteInteligente.Application/Caixa/DTOs/MovimentacaoCaixaDtos.cs`.
- [x] Implementar `RegistrarMovimentacaoCaixaUseCase.cs` em `src/RestauranteInteligente.Application/Caixa/UseCases/RegistrarMovimentacaoCaixaUseCase.cs` (validação de caixa aberto e saldo de gaveta para sangria).
- [x] Implementar `ObterResumoTurnoUseCase.cs` em `src/RestauranteInteligente.Application/Caixa/UseCases/ObterResumoTurnoUseCase.cs` (cálculo de faturamento, ticket médio, pagamentos e saldo em dinheiro).
- [x] Criar DTOs e implementar `RegistrarOrdemCompraUseCase.cs` em `src/RestauranteInteligente.Application/Previsoes/UseCases/RegistrarOrdemCompraUseCase.cs`.
- [x] Adicionar endpoints `POST /caixa/suprimento`, `POST /caixa/sangria` e `GET /caixa/resumo-turno` em `src/RestauranteInteligente.Api/Controllers/FechamentosController.cs`.
- [x] Adicionar endpoint `POST /previsoes/ordens-compra` em `src/RestauranteInteligente.Api/Controllers/PrevisoesController.cs`.
- [x] Registrar use cases na injeção de dependência em `src/RestauranteInteligente.Application/DependencyInjection.cs`.
- [x] Validar compilação e testes unitários do backend (`dotnet test --verbosity minimal`).

### Lote 3: Frontend Services, Hooks e Componentes (React Native)
- [x] Remover simulação de erro/fallback fictício em `src/frontend/features/caixa/services/caixaService.ts:L93-L114` no método `fecharCaixa()`.
- [x] Conectar `perfilService.ts` (`src/frontend/features/perfil/services/perfilService.ts:L8-L55`) aos endpoints reais via `apiClient`: `obterMetricasTurno()` -> `GET /caixa/resumo-turno`, `registrarMovimentacao()` -> `POST /caixa/suprimento` ou `POST /caixa/sangria`.
- [x] Atualizar `usePerfil.ts` (`src/frontend/features/perfil/hooks/usePerfil.ts:L118-L129`) substituindo o `setTimeout(600)` pela chamada real `caixaService.fecharCaixa()`.
- [x] Conectar `previsoesService.enviarOrdemCompra()` (`src/frontend/features/previsoes/services/previsoesService.ts:L78-L86`) ao endpoint real `POST /previsoes/ordens-compra`.
- [x] Conectar `previsoesService.obterFichaTecnica()` (`src/frontend/features/previsoes/services/previsoesService.ts:L55-L76`) ao endpoint real `GET /estoque/fichas-tecnicas`, eliminando o arquivo `previsoesFichasMock.ts`.
- [x] Validar compilação e tipagem do frontend (`npx tsc --noEmit`).

### Lote 4: Validação Cruzada e Graft
- [x] Atualizar grafo estrutural do repositório (`graft build`).
- [x] Executar suíte de testes cruzada e registrar log final em `docs/orquestracao/02-log-execucao.md`.
