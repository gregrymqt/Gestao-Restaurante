# Plano Atual: Evolução do Backoffice SuperAdmin SaaS (UI/UX, Modais e Paginação da API)

Status: Concluído
Data: 2026-11-21

## 1. Contexto e Invariantes
- **Backoffice SuperAdmin:** Gestão visual cross-tenant de inquilinos da plataforma SaaS, planos e vigência de degustação (Trial).
- **Segurança RBAC Estrita:** Exclusivo para usuários com role `SuperAdmin` ou `Admin`. Bloqueio estrito com `403 Forbidden` para `Manager`, `Owner` e `Cashier`/`Operator`.
- **UI/UX Mobile First:**
  - Substituição do `ScrollView` por `<FlashList>` virtualizado com rolagem fluida e performance garantida.
  - Modais dedicados do Design System:
    - `ModalConfirmarSuspensao`: Proteção contra cliques acidentais em ações destrutivas (suspensão com impacto em PDV ativo).
    - `ModalEstenderTrial`: Chips de atalho (+7d, +14d, +30d) e input numérico flexível.
  - Chips rápidos e interativos de filtro por status no topo: [Todos], [Trials], [Ativos], [Expirados].
  - Busca com debounce (300ms) e `EmptyStateTenants` ilustrado quando nenhum resultado for encontrado.
  - Feedback visual via Toasts não-intrusivos reutilizando `RealtimeEventToast` (`useSseStatus.showToast`).
- **Backend Paginado e Filtrado:**
  - `GET /api/v1/admin/tenants` com suporte a query params (`busca`, `status`, `pagina`, `itensPorPagina`).
  - Resposta encapsulada em `TenantsAdminPaginadoDto` com metadados de paginação.

---

## 2. Tarefas Atômicas de Execução

### Lote 1: DTOs e Casos de Uso do Backend (.NET 9)
- [x] Atualizar `src/RestauranteInteligente.Application/Admin/DTOs/AdminDtos.cs:L20-L27`:
  - Adicionar `ConsultaTenantsAdminFiltro(string? Busca = null, string? Status = null, int Pagina = 1, int ItensPorPagina = 20)`.
  - Adicionar `TenantsAdminPaginadoDto(IReadOnlyList<TenantAdminItemDto> Itens, int TotalItens, int PaginaAtual, int TotalPaginas)`.
- [x] Atualizar `src/RestauranteInteligente.Application/Admin/UseCases/ListarTenantsAdminUseCase.cs:L29-L84`:
  - Atualizar assinatura de `ExecutarAsync` para receber `ConsultaTenantsAdminFiltro filtro` e `CancellationToken ct`.
  - Aplicar filtro de busca insensível a maiúsculas/minúsculas sobre `NomeRestaurante`, `Cnpj`, `GestorNome` e `GestorEmail`.
  - Aplicar filtro de status (`TRIAL`, `ATIVA`, `EXPIRADA`, `CANCELADA`) quando informado.
  - Calcular `TotalItens` e `TotalPaginas`.
  - Aplicar paginação em memória/repositório (`Skip((pagina - 1) * itensPorPagina).Take(itensPorPagina)`).
  - Retornar instância de `TenantsAdminPaginadoDto`.

### Lote 2: Controller da API (.NET 9)
- [x] Atualizar `src/RestauranteInteligente.Api/Controllers/AdminController.cs:L34-L49`:
  - Atualizar endpoint `[HttpGet("tenants")]` para receber `[FromQuery] string? busca`, `[FromQuery] string? status`, `[FromQuery] int pagina = 1`, `[FromQuery] int itensPorPagina = 20`, e `CancellationToken ct`.
  - Invocar `_listarTenantsUseCase.ExecutarAsync(new ConsultaTenantsAdminFiltro(busca, status, pagina, itensPorPagina), ct)`.
  - Retornar `200 OK` com `TenantsAdminPaginadoDto`.

### Lote 3: Tipos, Serviços e Hooks do Frontend (React Native / TypeScript)
- [x] Atualizar `src/frontend/features/admin/types/index.ts:L1-L27`:
  - Adicionar tipo `FiltroStatusTenant = 'TODOS' | 'TRIAL' | 'ATIVA' | 'EXPIRADA'`.
  - Adicionar interface `TenantsAdminPaginadoResponse` contendo `itens: TenantAdminItem[]`, `totalItens: number`, `paginaAtual: number`, `totalPaginas: number`.
- [x] Atualizar `src/frontend/features/admin/services/adminService.ts:L38-L50`:
  - Atualizar `listarTenants` para aceitar `filtro?: { busca?: string; status?: string; pagina?: number; itensPorPagina?: number }`.
  - Construir query string dinamicamente (`/admin/tenants?busca=...&status=...&pagina=...&itensPorPagina=...`).
  - Suportar fallback mock paginado caso o backend esteja em homologação offline.
- [x] Atualizar `src/frontend/features/admin/hooks/useAdminTenants.ts:L6-L69`:
  - Adicionar controle de estado para `busca`, `debounceBusca` (300ms), `statusFiltro` e `paginaAtual`.
  - Adicionar mutações de `estenderTrial` e `alterarStatus` integradas com `useSseStatus.getState().showToast({ titulo, mensagem, tipo: 'sucesso', icone })`.

### Lote 4: Componentes e UI/UX (React Native / Design System)
- [x] Criar `src/frontend/features/admin/components/ModalEstenderTrial.tsx`:
  - Modal estilizado com tokens de design (`tokens.colors`, `tokens.radii`).
  - Seletores de atalho: `+7 dias`, `+14 dias`, `+30 dias`.
  - Input numérico livre para quantidade de dias personalizada.
  - Botão de confirmação com spinner de loading e prevenção de duplo clique.
- [x] Criar `src/frontend/features/admin/components/ModalConfirmarSuspensao.tsx`:
  - Modal com destaque visual em vermelho (`tokens.colors.status.redText`).
  - Alerta explícito de que a suspensão desconecta operadores de caixa do PDV imediatamente.
  - Ações de duplo clique seguro: "Cancelar" e "Confirmar Suspensão".
- [x] Criar `src/frontend/features/admin/components/EmptyStateTenants.tsx`:
  - Visual ilustrado moderno para estados sem resultados de busca ou filtros.
  - Botão "Limpar Filtros" para resetar a busca e status.
- [x] Atualizar `src/frontend/features/admin/components/CardTenantAdmin.tsx:L80-L135`:
  - Substituir disparo imediato por callbacks `onAbrirModalTrial(tenant)` e `onAbrirModalSuspender(tenant)`.
  - Garantir área de toque acessível (hitSlop 48x48dp).
- [x] Atualizar `src/frontend/features/admin/screens/AdminBackofficeScreen.tsx:L70-L150`:
  - Substituir métricas estáticas do topo por Chips clicáveis com badge de contagem: `Todos`, `Trials (X)`, `Ativos (Y)`, `Expirados (Z)`.
  - Substituir `ScrollView` por `<FlashList>` virtualizado com alta performance mobile.
  - Integrar `EmptyStateTenants` na prop `ListEmptyComponent`.
  - Conectar os novos modais `ModalEstenderTrial` e `ModalConfirmarSuspensao`.
  - Desacoplar estilos em `AdminBackofficeScreen.styles.ts` garantindo < 300 linhas.

### Lote 5: Testes Unitários e Validação Completa
- [x] Atualizar `tests/RestauranteInteligente.UnitTests/RbacAuthorizationDiscriminatoryTests.cs`:
  - Adaptar mocks do `ListarTenantsAdminUseCase` para o novo modelo paginado e validar retorno de `TenantsAdminPaginadoDto`.
- [x] Criar testes unitários frontend `src/frontend/__tests__/adminBackofficeFlow.test.ts`:
  - Testar debounce de busca, filtragem por chip de status e formatação de payloads dos novos modais.
- [x] Executar compilação silenciosa: `dotnet build --verbosity minimal`.
- [x] Executar testes de unidade .NET: `dotnet test --verbosity minimal` (247 testes aprovados).
- [x] Executar validação de tipos TypeScript: `npx tsc --project src/frontend/tsconfig.json --noEmit` (0 erros).
- [x] Executar suíte de testes frontend: `npx tsx src/frontend/__tests__/adminBackofficeFlow.test.ts` (100% aprovado).
- [x] Executar linter estrutural: `node scripts/graft-lint.mjs --scope src/frontend/features/admin` (100% conforme).
- [x] Atualizar o grafo de código: `graft build` (2555 nós, 2428 arestas).
- [x] Registrar resumo de execução em `docs/orquestracao/02-log-execucao.md`.
