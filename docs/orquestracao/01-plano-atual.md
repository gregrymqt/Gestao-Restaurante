# Plano Atual: Gestão e Recebimento de Ordens de Compra de Insumos Críticos

Status: Concluído
Data: 2026-11-23

## 1. Contexto e Invariantes
- **Multi-Tenant em Dupla Camada:** Toda consulta/comando restringe `RestauranteId` via `IRestauranteEntity` e interceptor transacional RLS.
- **Ledger de Estoque Imutável:** O recebimento de mercadoria gera registros `MovimentacoesEstoque` append-only (`Tipo = Entrada`, `Origem = Compra`), mantendo `Insumos.QuantidadeEstoque` atomicamente atualizado.
- **Anti-Deadlock na Entrada de Insumos:** Ordenar sempre por `InsumoId ASC` antes de invocar bloqueio pessimista `ObterPorIdsParaAtualizacaoAsync` (`SELECT ... FOR UPDATE`).
- **Clean Architecture (.NET 9):** Regras de transição (`PENDENTE` -> `APROVADA` -> `RECEBIDA`) e cálculo no `Domain`. Use Cases dedicados para Listagem, Atualização de Status e Recebimento Atômico.
- **Frontend React Native (Expo SDK 58):** Aba dedicada em `features/estoque` integrada ao `SegmentedEstoqueControl`, `<FlashList>`, suporte obrigatório a `signal?: AbortSignal` e teto rígido de 300 linhas por arquivo.

---

## 2. Tarefas Atômicas de Execução

### Lote 1: Domínio e Repositórios (.NET)
- [x] Atualizar `src/RestauranteInteligente.Domain/Entities/OrdemCompra.cs:L20-L75`:
  - Adicionar propriedades `Fornecedor`, `Observacao`, `AtualizadoEm`.
  - Adicionar métodos `Aprovar(string? fornecedor, string? observacao)`, `MarcarRecebida()` e `Cancelar(string? motivo)`.
- [x] Atualizar `src/RestauranteInteligente.Domain/Common/Interfaces/IOrdemCompraRepository.cs:L8-L13`:
  - Declarar `Task<IReadOnlyList<OrdemCompra>> ListarAsync(string? status = null, CancellationToken ct = default)`.
  - Declarar `Task<OrdemCompra?> ObterParaAtualizacaoAsync(Guid id, CancellationToken ct = default)`.
- [x] Atualizar `src/RestauranteInteligente.Infrastructure/Persistence/Configurations/OrdemCompraConfiguration.cs:L20-L61`:
  - Mapear colunas `Fornecedor` (varchar 150 nullable), `Observacao` (varchar 500 nullable), `AtualizadoEm` (timestamptz nullable).
- [x] Atualizar `src/RestauranteInteligente.Infrastructure/Persistence/Repositories/OrdemCompraRepository.cs:L19-L40`:
  - Implementar `ListarAsync` com `.Include(o => o.Itens).ThenInclude(i => i.Insumo).AsNoTracking()` e ordenação `CriadoEm DESC`.
  - Implementar `ObterParaAtualizacaoAsync` com `.Include(o => o.Itens).ThenInclude(i => i.Insumo)`.

### Lote 2: Casos de Uso e Injeção de Dependência (.NET)
- [x] Criar DTOs em `src/RestauranteInteligente.Application/Previsoes/DTOs/OrdemCompraDetalheDtos.cs`:
  - Declarar `ItemOrdemCompraDetalheDto`, `OrdemCompraDetalheDto`, `AtualizarStatusOrdemCompraInputDto` e `ReceberOrdemCompraOutputDto`.
- [x] Criar `src/RestauranteInteligente.Application/Previsoes/UseCases/ListarOrdensCompraUseCase.cs`:
  - Obter ordens do tenant e mapear para lista de `OrdemCompraDetalheDto`.
- [x] Criar `src/RestauranteInteligente.Application/Previsoes/UseCases/AtualizarStatusOrdemCompraUseCase.cs`:
  - Validar transições de status (`APROVADA`, `CANCELADA`) e comitar via Unit of Work.
- [x] Criar `src/RestauranteInteligente.Application/Previsoes/UseCases/ReceberOrdemCompraUseCase.cs`:
  - Transação explícita com Unit of Work.
  - Ordenar insumos por `InsumoId ASC` antes de `_insumoRepository.ObterPorIdsParaAtualizacaoAsync`.
  - Creditar estoque em cada insumo, registrar `MovimentacaoEstoque(Entrada, Compra)` no ledger e atualizar status da ordem para `RECEBIDA`.
- [x] Atualizar `src/RestauranteInteligente.Application/DependencyInjection.cs:L30-L45`:
  - Registrar os três novos use cases no container de serviços.

### Lote 3: Endpoints da API (.NET)
- [x] Atualizar `src/RestauranteInteligente.Api/Controllers/PrevisoesController.cs:L18-L121`:
  - Injetar `ListarOrdensCompraUseCase`, `AtualizarStatusOrdemCompraUseCase` e `ReceberOrdemCompraUseCase`.
  - Adicionar endpoint `GET /api/v1/previsoes/ordens-compra?status=...`.
  - Adicionar endpoint `PATCH /api/v1/previsoes/ordens-compra/{id:guid}/status`.
  - Adicionar endpoint `POST /api/v1/previsoes/ordens-compra/{id:guid}/receber`.

### Lote 4: Camada de Serviços e Hooks no Frontend
- [x] Atualizar `src/frontend/features/previsoes/types/index.ts`:
  - Adicionar tipos `OrdemCompraDetalhe`, `ItemOrdemCompraDetalhe`, `AtualizarStatusOrdemCompraInput`, `ReceberOrdemCompraResponse`.
- [x] Atualizar `src/frontend/features/previsoes/services/previsoesService.ts:L108-L156`:
  - Implementar `listarOrdensCompra`, `atualizarStatusOrdemCompra` e `receberOrdemCompra` com `signal?: AbortSignal`.
- [x] Criar `src/frontend/features/previsoes/hooks/useOrdensCompra.ts`:
  - Hook TanStack Query `useOrdensCompra(statusFiltro)` e mutations para atualizar status e receber mercadoria.

### Lote 5: Componentes e Telas no Frontend
- [x] Atualizar `src/frontend/features/estoque/components/SegmentedEstoqueControl.tsx:L1-L60`:
  - Incluir segmento `'ordens'` (rótulo: "Ordens").
- [x] Criar `src/frontend/features/estoque/components/OrdensCompraTab.tsx`:
  - Pílulas de filtro (`Todas`, `Pendentes`, `Compradas`, `Recebidas`).
  - Card de ordem com listagem de itens, protocolo, data, valor e ações contextuais ("Marcar como Comprada", "Receber Mercadoria", "Cancelar").
- [x] Criar `src/frontend/features/estoque/components/ModalMarcarComprada.tsx`:
  - Formulário para informar fornecedor e observações antes de mudar status para `APROVADA`.
- [x] Atualizar `src/frontend/features/estoque/screens/EstoqueScreen.tsx:L35-L165`:
  - Suportar aba `'ordens'` renderizando `OrdensCompraTab`.
- [x] Atualizar `src/frontend/features/dashboard/components/AlertaEstoqueCriticoCard.tsx:L110-L151` e `DashboardScreen.tsx:L30-L130`:
  - Substituir estado local volátil de ordem pendente por redirecionamento direto para a aba de Ordens no Estoque.

### Lote 6: Testes Automatizados e Build
- [x] Criar testes unitários em `tests/RestauranteInteligente.UnitTests/Previsoes/ReceberOrdemCompraUseCaseTests.cs`.
- [x] Criar testes unitários em `tests/RestauranteInteligente.UnitTests/Previsoes/AtualizarStatusOrdemCompraUseCaseTests.cs`.
- [x] Atualizar `src/frontend/__tests__/servicesErrorHandling.test.ts` cobrindo os novos métodos do `previsoesService`.
- [x] Validar compilação e execução de testes:
  - `dotnet test --verbosity minimal`
  - `Push-Location src/frontend; $env:EXPO_PUBLIC_API_URL="http://localhost:5000/api/v1"; npx tsx --test __tests__/servicesErrorHandling.test.ts; Pop-Location`
  - `graft build`
