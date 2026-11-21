# Plano Atual: Implementação de Sinal de Aborto Cooperativo no Frontend (Services, Hooks e Interceptors)

Status: Concluído
Data: 2026-11-21

## 1. Contexto e Invariantes
- **Padrão Cooperativo Duplo:** Injeção do `AbortSignal` nativo do TanStack Query v5 nos hooks de leitura (`useQuery`) e criação/cleanup de `AbortController` nativo em hooks com `useEffect` (`usePerfil`, `useHistoricoVendas`).
- **Resiliência e Higiene de Rede:** Requisições abortadas intencionalmente (`ERR_CANCELED` / `CanceledError`) não devem acionar o detector de queda de servidor (`setApiOnline(false)`), nem rotinas de deslogamento por 401, nem emitir Toasts de erro ao operador.
- **Integridade de Cache e Fallbacks:** Services com fallbacks mock não devem engolir cancelamentos de requisições em voo; se `axios.isCancel(err)`, relançar o erro (`throw err`) para que o React Query gerencie o ciclo de vida sem poluir o cache com dados falsos.
- **Mutações Seguras:** Mutações de negócio (vendas, caixa, estoque, assinaturas) suportam `signal?: AbortSignal` opcional sem cancelamento automático agressivo em unmounts transitórios.
- **Teto Arquitetural:** Respeitar o limite de 300 linhas por arquivo e tipagem estrita (proibido `any`).

---

## 2. Tarefas Atômicas de Execução

### Lote 1: Camada de Rede Base & Interceptor de Erro
- [x] Atualizar `src/frontend/shared/services/api.ts:L63-L110`:
  - Importar `isCancel` de `axios`.
  - No interceptor de resposta (`apiClient.interceptors.response.use`), verificar se `axios.isCancel(error)`. Caso afirmativo, rejeitar imediatamente (`return Promise.reject(error)`) sem alterar o status da API para offline (`useConnectionStore.getState().setApiOnline(false)`).
  - Na função `extractErrorMessage`, verificar `if (axios.isCancel(err)) return ''` ou tratar cancelamento para não exibir mensagem de erro no UI.

### Lote 2: Propagação de AbortSignal nos 11 Feature Services
- [x] Atualizar `src/frontend/features/admin/services/adminService.ts:L92-L151`:
  - Adicionar parâmetro opcional `signal?: AbortSignal` a `listarTenants`, `estenderTrial` e `alterarStatus`.
  - Repassar `{ signal }` nas opções das chamadas `apiClient.get` e `apiClient.post`.
  - No catch de `listarTenants`, verificar `if (axios.isCancel(err)) throw err;`.
- [x] Atualizar `src/frontend/features/assinatura/services/assinaturaService.ts:L30-L49`:
  - Adicionar parâmetro opcional `signal?: AbortSignal` a `obterStatus` e `assinarPlano`.
  - Repassar `{ signal }` nas chamadas `apiClient.get` e `apiClient.post`.
- [x] Atualizar `src/frontend/features/auth/services/authService.ts:L74-L278`:
  - Adicionar `signal?: AbortSignal` em `obterOperadoresRecentes`, `loginComPin`, `login`, `cadastrarRestaurante`, `validarPin`, `definirPin`, `solicitarRecuperacaoSenha` e `redefinirSenha`.
  - Repassar `{ signal }` para o `apiClient`.
- [x] Atualizar `src/frontend/features/caixa/services/caixaService.ts:L77-L115`:
  - Adicionar `signal?: AbortSignal` a `abrirCaixa`, `obterSessaoAtiva` e `fecharCaixa`.
  - Repassar `{ signal }` para o `apiClient`.
- [x] Atualizar `src/frontend/features/dashboard/services/dashboardService.ts:L55-L94`:
  - Adicionar `signal?: AbortSignal` a `obterResumoExecutivo`.
  - Repassar `{ signal }` para `apiClient.get`.
  - No catch, verificar `if (axios.isCancel(e)) throw e;` antes de devolver fallback mock.
- [x] Atualizar `src/frontend/features/estoque/services/estoqueService.ts:L71-L165`:
  - Adicionar `signal?: AbortSignal` a `obterInsumos`, `obterFichasTecnicas`, `registrarEntradaEstoque`, `cadastrarInsumo`, `registrarBaixaEstoque` e `salvarFichaTecnica`.
  - Repassar `{ signal }` em todas as chamadas `apiClient`.
  - No catch de `obterInsumos` e `obterFichasTecnicas`, checar `if (axios.isCancel(err)) throw err;`.
- [x] Atualizar `src/frontend/features/kds/services/kdsService.ts:L5-L19`:
  - Adicionar `signal?: AbortSignal` a `listarPedidosAtivos` e `atualizarStatusPedido`.
  - Repassar `{ signal }` para o `apiClient`.
- [x] Atualizar `src/frontend/features/perfil/services/equipeService.ts:L21-L58`:
  - Adicionar `signal?: AbortSignal` a `listarEquipe`, `cadastrarOperador`, `desativarOperador` e `ativarOperador`.
  - Repassar `{ signal }` para o `apiClient`.
- [x] Atualizar `src/frontend/features/perfil/services/perfilService.ts:L10-L59`:
  - Adicionar `signal?: AbortSignal` a `obterMetricasTurno`, `obterStatusTerminal` e `registrarMovimentacao`.
  - Repassar `{ signal }` para o `apiClient`.
- [x] Atualizar `src/frontend/features/previsoes/services/previsoesService.ts:L18-L128`:
  - Adicionar `signal?: AbortSignal` a `obterCapacidadeProducao`, `obterFichaTecnica` e `enviarOrdemCompra`.
  - Repassar `{ signal }` para o `apiClient`.
  - No catch de `obterCapacidadeProducao` e `obterFichaTecnica`, checar `if (axios.isCancel(e)) throw e;`.
- [x] Atualizar `src/frontend/features/vendas/services/vendasService.ts:L38-L90`:
  - Adicionar `signal?: AbortSignal` a `obterProdutos`, `registrarVenda`, `obterHistorico`, `obterModificadoresProduto` e `criarProduto`.
  - Repassar `{ signal }` para o `apiClient`.
  - No catch de `obterProdutos` e `obterHistorico`, checar `if (axios.isCancel(err)) throw err;`.

### Lote 3: Injeção de Sinal nos Hooks de Consulta (`useQuery`)
- [x] Atualizar `src/frontend/features/admin/hooks/useAdminTenants.ts:L40-L49`:
  - Ajustar `queryFn: ({ signal }) => adminService.listarTenants({ ... }, signal)`.
- [x] Atualizar `src/frontend/features/assinatura/hooks/useAssinatura.ts:L24-L35`:
  - Ajustar `queryFn: ({ signal }) => assinaturaService.obterStatus(signal)`.
- [x] Atualizar `src/frontend/features/caixa/hooks/useCaixaAtual.ts:L13-L17`:
  - Ajustar `queryFn: ({ signal }) => caixaService.obterSessaoAtiva(signal)`.
- [x] Atualizar `src/frontend/features/dashboard/hooks/useDashboardExecutivo.ts:L15-L19`:
  - Ajustar `queryFn: ({ signal }) => dashboardService.obterResumoExecutivo(signal)`.
- [x] Atualizar `src/frontend/features/estoque/hooks/useInsumosEstoque.ts:L45-L63`:
  - Ajustar `queryFn: ({ signal }) => estoqueService.obterInsumos(signal)`.
  - Ajustar `queryFn: ({ signal }) => estoqueService.obterFichasTecnicas(signal)`.
- [x] Atualizar `src/frontend/features/kds/hooks/useKdsPedidos.ts:L11-L16`:
  - Ajustar `queryFn: ({ signal }) => kdsService.listarPedidosAtivos(signal)`.
- [x] Atualizar `src/frontend/features/previsoes/hooks/useCapacidadeProducao.ts:L30-L45`:
  - Ajustar `queryFn: ({ signal }) => previsoesService.obterCapacidadeProducao(dataAlvo, signal)`.
- [x] Atualizar `src/frontend/features/vendas/hooks/useCatalogoProdutos.ts:L52-L65`:
  - Ajustar `queryFn: ({ signal }) => vendasService.obterProdutos(signal)`.
- [x] Atualizar `src/frontend/features/vendas/hooks/useModificadoresProduto.ts:L12-L25`:
  - Ajustar `queryFn: ({ signal }) => vendasService.obterModificadoresProduto(produtoId, signal)`.

### Lote 4: Hooks de Efeito Direto (`useEffect` com `AbortController`)
- [x] Atualizar `src/frontend/features/perfil/hooks/usePerfil.ts:L43-L47`:
  - Instanciar `const controller = new AbortController();` dentro do `useEffect`.
  - Passar `controller.signal` para `perfilService.obterMetricasTurno` e `perfilService.obterStatusTerminal`.
  - Adicionar proteção para não exibir erros nem console warning se `axios.isCancel(err)`.
  - Retornar cleanup `return () => controller.abort();`.
- [x] Atualizar `src/frontend/features/vendas/hooks/useHistoricoVendas.ts:L11-L35`:
  - Adaptar `carregarHistorico` para aceitar `signal?: AbortSignal`.
  - No `useEffect`, criar `AbortController`, passar para a chamada e abortar no cleanup.
  - Eliminar uso de `err: any` e suprimir `setErro` quando `axios.isCancel(err)`.

### Lote 5: Hooks de Mutação (`useMutation`)
- [x] Atualizar hooks de mutação para permitir o repasse opcional de `signal`:
  - `src/frontend/features/vendas/hooks/useRegistrarVenda.ts:L20-L27`
  - `src/frontend/features/caixa/hooks/useFecharCaixa.ts:L15-L25`
  - `src/frontend/features/caixa/hooks/useMovimentacaoCaixa.ts:L15-L25`
  - `src/frontend/features/estoque/hooks/useCadastrarInsumo.ts:L10-L20`
  - `src/frontend/features/estoque/hooks/useRegistrarBaixaEstoque.ts:L10-L20`
  - `src/frontend/features/estoque/hooks/useRegistrarEntradaEstoque.ts:L10-L20`
  - `src/frontend/features/vendas/hooks/useCriarProduto.ts:L15-L25`

### Lote 6: Testes Automatizados e Auditoria de Qualidade
- [x] Atualizar `src/frontend/__tests__/servicesErrorHandling.test.ts`:
  - Adicionar suite cobrindo cancelamento com `AbortController`:
    - Validar rejeição como `CanceledError` quando o sinal é acionado.
    - Validar que `apiClient` não altera `useConnectionStore.getState().isApiOnline` para `false` ao cancelar.
    - Validar que fallbacks de mock não são ativados em cancelamentos.
- [x] Executar validação silenciosa de testes e linter:
  - `Push-Location src/frontend; $env:EXPO_PUBLIC_API_URL="http://localhost:5000/api/v1"; npx tsx --test __tests__/servicesErrorHandling.test.ts; Pop-Location`
  - `dotnet test --verbosity minimal`
  - `graft build`
