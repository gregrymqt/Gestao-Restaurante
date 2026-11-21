# Plano Atual: Padronização de Tratamento de Erros e Eliminação de `any` nas Feature Services

Status: Concluído
Data: 2026-11-21

## 1. Contexto e Invariantes
- Substituição de `any` por `unknown` em todos os blocos `catch` e tipagens de dados das feature services.
- Adoção sistemática do utilitário `extractErrorMessage(err: unknown, fallback: string): string` centralizado em `@/shared/services/api` (e reexportado em `@/services/api`).
- Preservação da alta disponibilidade e resiliência das consultas de leitura (GET) com seus mocks/fallbacks existentes no terminal.
- Propagação padronizada de `throw new Error(extractErrorMessage(err, fallback))` para todas as mutações (POST, PUT, PATCH, DELETE) para consumo direto nos hooks via `onError: (err: Error) => AppDialog.error(...)`.
- Respeito estrito às regras de `AGENTS.md`:
  - Tipagem 100% estrita sem `any`.
  - Teto de 300 linhas por arquivo respeitado em todas as services.
  - Validação via `tsc --noEmit`, suíte `node:test` e auditoria `scripts/graft-lint.mjs`.

---

## 2. Tarefas Atômicas de Execução

### Lote 1: Serviços de Gestão e Administração (`admin`, `assinatura`)
- [x] Atualizar `src/frontend/features/admin/services/adminService.ts:L1,L51-L78`:
  - Importar `extractErrorMessage` de `@/shared/services/api`.
  - Em `estenderTrial`: substituir `catch (err: any)` por `catch (err: unknown)` e lançar `new Error(extractErrorMessage(err, 'Falha ao estender dias de trial.'))`.
  - Em `alterarStatus`: substituir `catch (err: any)` por `catch (err: unknown)` e lançar `new Error(extractErrorMessage(err, 'Falha ao alterar status de assinatura.'))`.
- [x] Atualizar `src/frontend/features/assinatura/services/assinaturaService.ts:L1,L39-L49`:
  - Importar `extractErrorMessage` de `@/shared/services/api`.
  - Em `assinarPlano`: substituir `catch (err: any)` por `catch (err: unknown)` e lançar `new Error(extractErrorMessage(err, 'Não foi possível contratar o plano. Tente novamente.'))`.

### Lote 2: Serviços de Operação do Restaurante (`caixa`, `dashboard`, `perfil`)
- [x] Atualizar `src/frontend/features/caixa/services/caixaService.ts:L1,L66-L95`:
  - Importar `extractErrorMessage` de `@/services/api`.
  - Em `abrirCaixa`: envolver POST em `try/catch (err: unknown)` lançando `new Error(extractErrorMessage(err, 'Não foi possível abrir o caixa.'))`.
  - Em `fecharCaixa`: envolver POST em `try/catch (err: unknown)` lançando `new Error(extractErrorMessage(err, 'Não foi possível fechar o caixa.'))`.
  - Em `obterSessaoAtiva`: substituir `apiClient.get<any>` por tipagem estrita de resposta do resumo.
- [x] Atualizar `src/frontend/features/dashboard/services/dashboardService.ts:L41-L77`:
  - Definir interface para o payload de `/dashboard/resumo` e substituir `apiClient.get<any>` e `(i: any) =>` por tipagem estrita sem `any`.
- [x] Atualizar `src/frontend/features/perfil/services/perfilService.ts:L1,L26-L51`:
  - Importar `extractErrorMessage` de `@/services/api`.
  - Em `registrarMovimentacao`: envolver POST em `try/catch (err: unknown)` lançando `new Error(extractErrorMessage(err, 'Não foi possível registrar o lançamento de caixa.'))`.

### Lote 3: Serviços de Estoque, KDS, Vendas e IA (`estoque`, `kds`, `vendas`, `previsoes`)
- [x] Atualizar `src/frontend/features/estoque/services/estoqueService.ts:L1,L119-L154`:
  - Importar `extractErrorMessage` de `@/services/api`.
  - Em `registrarEntradaEstoque`: envolver POST em `try/catch (err: unknown)` com `extractErrorMessage(err, 'Não foi possível registrar entrada no estoque.')`.
  - Em `cadastrarInsumo`: envolver POST em `try/catch (err: unknown)` com `extractErrorMessage(err, 'Não foi possível cadastrar o insumo.')`.
  - Em `registrarBaixaEstoque`: envolver POST em `try/catch (err: unknown)` com `extractErrorMessage(err, 'Não foi possível registrar a baixa de estoque.')`.
- [x] Atualizar `src/frontend/features/kds/services/kdsService.ts:L1,L10-L14`:
  - Importar `extractErrorMessage` de `@/shared/services/api`.
  - Em `atualizarStatusPedido`: envolver PATCH em `try/catch (err: unknown)` com `extractErrorMessage(err, 'Não foi possível atualizar o status do pedido no KDS.')`.
- [x] Atualizar `src/frontend/features/vendas/services/vendasService.ts:L1,L50-L76`:
  - Importar `extractErrorMessage` de `@/services/api`.
  - Em `registrarVenda`: envolver POST em `try/catch (err: unknown)` com `extractErrorMessage(err, 'Não foi possível registrar a venda.')`.
  - Em `criarProduto`: envolver POST em `try/catch (err: unknown)` com `extractErrorMessage(err, 'Não foi possível cadastrar o produto.')`.
- [x] Atualizar `src/frontend/features/previsoes/services/previsoesService.ts:L1,L99-L125`:
  - Importar `extractErrorMessage` de `@/services/api`.
  - Em `enviarOrdemCompra`: envolver POST em `try/catch (err: unknown)` com `extractErrorMessage(err, 'Não foi possível emitir a ordem de compra.')`.

### Lote 4: Testes Automatizados, Lint e Grafo
- [x] Criar `src/frontend/__tests__/servicesErrorHandling.test.ts`:
  - Cobrir `extractErrorMessage` com cenários `res.data.error`, `res.data.detail`, `res.data.title`, `Error` nativo e valores anônimos.
  - Cobrir métodos refatorados das services garantindo lançamento de `Error` com mensagens extraídas.
- [x] Validar compilação com `npx tsc --project src/frontend/tsconfig.json --noEmit`.
- [x] Executar testes com `$env:EXPO_PUBLIC_API_URL="http://localhost:5000/api/v1"; npx tsx --tsconfig src/frontend/tsconfig.json --test src/frontend/__tests__/servicesErrorHandling.test.ts`.
- [x] Executar auditoria de conformidade com `node scripts/graft-lint.mjs --scope src/frontend`.
- [x] Executar `npx graft build` para indexar o grafo do repositório (2465 nós, 2314 arestas).
- [x] Registrar resumo no arquivo `docs/orquestracao/02-log-execucao.md`.
