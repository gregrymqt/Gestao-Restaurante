# Log de Execução

## [2026-11-22] Correção de Anomalias de UI, Formatação de Comanda e Sincronização
- Resolvido mojibake UTF-8 em `GruposModificadores` no Postgres e sanitizado prefixo duplicado `+` na comanda (`RevisaoComandaSheet.tsx`).
- Corrigido cálculo de capacidade em `FichasTecnicasList.tsx` para indicar esgotamento quando `capacidadeTurnoPorcoes <= 0`.
- Ampliada busca de ficha técnica em `previsoesService.ts` com correspondência estendida de ID e nome de produto.
- Ajustado estado inicial de conexão SSE em `useSseStatus.ts` para `CONNECTING`, eliminando falso selo `Offline` no boot do KDS.
- Tipagem validada via `npx tsc --noEmit` com 0 erros.

## [2026-11-21] Lote 1: Domínio e Persistência Backend (.NET 9)
- Criadas entidades de domínio `MovimentacaoCaixa`, `OrdemCompra` e `ItemOrdemCompra` com invariantes multi-tenant e numéricas.
- Interfaces `IFechamentoCaixaRepository` e `IOrdemCompraRepository` definidas e mapeadas em `AppDbContext` e repositórios EF Core.
- Mapeamentos `MovimentacaoCaixaConfiguration`, `OrdemCompraConfiguration` e `ItemOrdemCompraConfiguration` criados com precisão `numeric(18,2/4)` e `timestamptz`.
- Registrada injeção de dependência de `IOrdemCompraRepository` e adicionados 3 novos testes unitários em `DomainEntitiesTests`.
- Build do módulo bem-sucedido e todos os 211 testes unitários aprovados com 0 falhas.

## [2026-11-21] Lote 2: Use Cases e Endpoints Backend (.NET 9)
- Implementados `RegistrarMovimentacaoCaixaUseCase`, `ObterResumoTurnoUseCase` e `RegistrarOrdemCompraUseCase` com DTOs.
- Validação estrita de saldo físico na gaveta para sangria e cálculo de métricas e breakdown de pagamentos em tempo real.
- Expostos endpoints `POST /caixa/suprimento`, `POST /caixa/sangria`, `GET /caixa/resumo-turno` e `POST /previsoes/ordens-compra`.
- Criados 8 novos testes unitários dedicados aos use cases com Moq e FluentAssertions.
- Build do módulo bem-sucedido e todos os 219 testes unitários aprovados com 0 falhas.

## [2026-11-21] Lote 3 & 4: Frontend React Native & Validação Cruzada
- Eliminado mock resiliente `fc-XXXX` em `caixaService.fecharCaixa()` e unificado no `usePerfil.ts` com tratamento real de erro via `AppDialog.error`.
- Conectado `perfilService` a `GET /caixa/resumo-turno` e `POST /caixa/suprimento`/`sangria` com tipagem 100% estrita sem `any`.
- Conectado `previsoesService` a `POST /previsoes/ordens-compra` e `GET /estoque/fichas-tecnicas`, removendo `previsoesFichasMock.ts`.
- Validada tipagem TypeScript (`npx tsc --noEmit`) com 0 erros e atualizado grafo estrutural (`graft build`: 2387 nós, 2237 arestas).
- Suíte completa de 219 testes unitários backend validada com 100% de aprovação.

## [2026-11-21] PIN & Recuperação de Senha - Lote 1: Domínio e Persistência Backend (.NET 9)
- Adicionada propriedade `PinHash`, parâmetro no construtor e método `DefinirPin` na entidade `Usuario`.
- Configurado mapeamento EF Core de `PinHash` (varchar(255), opcional) em `UsuarioConfiguration`.
- Adicionados métodos `ObterPorIdAsync` (com bypass de query filters) e `AtualizarAsync` em `IUsuarioRepository` e `UsuarioRepository`.
- Criado helper de chave Redis `BuildPasswordResetKey` em `RedisKeyHelper` para gestão de OTP com TTL.
- Suíte de testes unitários de entidades e repositórios executada silenciosamente e validada com 100% de aprovação.

## [2026-11-21] PIN & Recuperação de Senha - Lote 2: Use Cases e Endpoints Backend (.NET 9)
- Criados Use Cases desacoplados: `ValidarPinTerminalUseCase`, `DefinirPinTerminalUseCase`, `SolicitarRecuperacaoSenhaUseCase` e `RedefinirSenhaUseCase`.
- Criada interface `IPasswordResetTokenService` e implementação `RedisPasswordResetTokenService` eliminando lógica de Redis e serviço do Controller.
- Expostos endpoints limpos em `AuthController`: `POST /validar-pin`, `POST /definir-pin`, `POST /esqueci-senha` e `POST /redefinir-senha` via `[FromServices]`.
- Criados 20 testes unitários dedicados em `AuthControllerTests` e `AuthUseCasesTests` cobrindo fluxos felizes e de exceção.
- Build validado com 0 erros/avisos e suíte completa de 234 testes unitários backend aprovada com 100% de sucesso.

## [2026-11-21] PIN & Recuperação de Senha - Lote 3 & 4: Frontend React Native & Grafo Graft
- Adicionados métodos `validarPin`, `definirPin`, `solicitarRecuperacaoSenha`, `redefinirSenha` e `logout` em `authService.ts`.
- `ModalBloqueioTerminal` e `usePerfil` integrados para validação assíncrona de PIN e logout seguro mantendo caixa fiscal aberto.
- Implementada rota `app/(auth)/esqueci-senha.tsx` e tela progressiva `EsqueciSenhaScreen` com estilo desacoplado (<300 linhas, sem any).
- Conectado link "Esqueceu a senha?" em `CredentialsCard` para navegação fluida no Expo Router.
- Compilação TypeScript validada com 0 erros e grafo estrutural sincronizado via `graft build` (2460 nós, 2280 arestas).

## [2026-11-21] Refatoração Global: Utilitário extractErrorMessage no apiClient
- Centralizada a função `extractErrorMessage(err: unknown, fallback: string): string` em `src/frontend/shared/services/api.ts` cobrindo `error`, `detail`, `title` (ProblemDetails) e `Error.message`.
- Reexportada a função em `src/frontend/shared/index.ts` e `src/frontend/services/api.ts` para consumo global em todas as features.
- Atualizado `authService.ts` consumindo `extractErrorMessage`, removendo `any` e tipando respostas de login/cadastro com interfaces estritas.
- Criados testes unitários para os cenários de erro da função em `src/frontend/__tests__/authTerminalAndReset.test.ts`.
- Validada compilação TypeScript (`tsc --noEmit`) com 0 erros e sincronizado o grafo com `graft build` (2462 nós, 2286 arestas).

## [2026-11-21] Lote 1 Concluído: adminService e assinaturaService com extractErrorMessage e unknown
- Eliminado o uso proibido de `any` em `estenderTrial`, `alterarStatus` (`adminService.ts`) e `assinarPlano` (`assinaturaService.ts`).
- Tratamento de erro padronizado para `catch (err: unknown)` com propagação via `new Error(extractErrorMessage(err, fallback))`.
- Compilação TypeScript validada com 0 erros (`tsc --noEmit`) e testes unitários aprovados com 100% de sucesso.
- Ocorrências de `any` no frontend reduzidas no `graft-lint`.

## [2026-11-21] Lote 2 Concluído: caixaService, dashboardService e perfilService padronizados
- Eliminado `apiClient.get<any>` em `caixaService.ts` e `dashboardService.ts` via interfaces tipadas com DTOs existentes.
- Interceptadas mutações em `abrirCaixa`, `fecharCaixa` e `registrarMovimentacao` com `try/catch (err: unknown)` e `extractErrorMessage`.
- Compilação TypeScript validada com 0 erros (`tsc --noEmit`) e `graft-lint` com 0 ocorrências de `any` em serviços de caixa/dashboard.

## [2026-11-21] Lote 3 Concluído: estoqueService, kdsService, vendasService e previsoesService
- Padronizadas mutações de estoque (`registrarEntradaEstoque`, `cadastrarInsumo`, `registrarBaixaEstoque`) com `extractErrorMessage`.
- Padronizadas mutações em `kdsService` (`atualizarStatusPedido`), `vendasService` (`registrarVenda`, `criarProduto`) e `previsoesService` (`enviarOrdemCompra`).
- Compilação TypeScript validada com 0 erros (`tsc --noEmit`) e todas as 10 feature services operando a 100% sem `any`.

## [2026-11-21] Lote 4 Concluído: Suíte de Testes Automatizada, Validação e Grafo
- Criada a suíte `servicesErrorHandling.test.ts` cobrindo extração de erros de API (error, detail, title), exceções nativas e fallbacks de rede.
- Validada rejeição e propagação de mensagens amigáveis em todas as services via mocks de `apiClient`.
- Compilação TypeScript aprovada com 0 erros (`tsc --noEmit`) e suíte de testes unitários executada com 100% de sucesso (7 testes).
- Grafo estrutural sincronizado via `graft build` (2465 nós, 2314 arestas).

## [2026-11-21] Refinamento UI/UX: Terminal Bloqueado e Recuperação de Senha (Mobile & A11y)
- Foco do PIN refinado com `border-gray-300`, `focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20`, teclado numérico estrito (4 dígitos) e reserva fixa de erro sem salto (`min-h-[20px]`).
- Ações secundárias transformadas em alvos de toque ergonômicos (`min-h-[44px]`), com texto neutro em `text-gray-500` e destaque acionável em `text-orange-600 font-semibold`.
- Conexão reativa ao estado `isOffline` desabilitando o envio OTP com aviso contextual e coerência de estado.
- Viewports fluidos com `min-h-[100dvh]`, scroll seguro com `env(safe-area-inset-bottom)` e conformidade de linhas (< 300) sem `any`.
- Validados compilação (`tsc --noEmit`), testes unitários (`node:test` 5/5 aprovados) e sincronização do grafo via `graft build`.

## [2026-11-21] Gestão de Equipe & PIN de PDV - Lote 1: Domínio, Repositório e DTOs (.NET 9)
- Adicionado contrato `ListarPorRestauranteAsync(Guid restauranteId)` em `IUsuarioRepository`.
- Implementado `ListarPorRestauranteAsync` em `UsuarioRepository` com filtro `RestauranteId`, `Ativo == true` e bypass de query filters.
- Criados DTOs tipados `CriarOperadorInputDto`, `OperadorResumoDto`, `LoginOperadorPinRequestDto` e `LoginOperadorPinResponseDto` em `OperadorDtos.cs`.
- Compilação validada com sucesso e 234 testes unitários executados com 100% de aprovação (0 falhas).

## [2026-11-21] Gestão de Equipe & PIN de PDV - Lote 2: Use Cases de Equipe e PIN (.NET 9)
- Criado `CriarOperadorUseCase` com validação de PIN de 4 dígitos, e-mail interno para balcão, hash seguro e persistência via `IUnitOfWork`.
- Criado `ListarOperadoresRestauranteUseCase` com projeção em `OperadorResumoDto` e extração dinâmica de iniciais para avatar.
- Criado `LoginOperadorPinUseCase` validando inquilino, hash de PIN e emissão de JWT/Refresh Token específicos de PDV.
- Registrados os três novos Use Cases no container IoC (`DependencyInjection.cs`).
- Compilação limpa e suíte completa de 234 testes unitários aprovada com 100% de sucesso.

## [2026-11-21] Gestão de Equipe & PIN de PDV - Lote 3: Endpoints da API (.NET 9)
- Adicionados endpoints públicos para terminal PDV em `AuthController`: `POST /api/v1/auth/login-pin` e `GET /api/v1/auth/operadores`.
- Criado `EquipeController` (`/api/v1/equipe`) restrito a `Manager,Owner,SuperAdmin` com listagem, cadastro e ativação/desativação.
- Segregação estrita multi-tenant garantida via `ITenantContext` e validação de vínculo do colaborador.
- Compilação do projeto `Api` validada com 0 erros/avisos e 234 testes unitários aprovados com 100% de sucesso.

## [2026-11-21] Gestão de Equipe & PIN de PDV - Lote 4: Frontend React Native & Expo
- Criado `equipeService.ts` com tipagem 100% estrita sem `any` e tratamento de erros via `extractErrorMessage`.
- Criados `ModalGestaoEquipe.tsx`, `.styles.ts` e `ColaboradorItemCard.tsx` com teto < 300 linhas para gestão de operadores e PINs.
- Conectados `authService.obterOperadoresRecentes` e `loginComPin` com `PinLoginModal.tsx` para login ágil e redirecionamento ao PDV.
- Adaptado `TabLayout` em `_layout.tsx` para segregar visualmente `role === 'Operator'` (PDV/Caixa) de abas administrativas.
- Validação TypeScript (`tsc --noEmit`) aprovada com 0 erros e conformidade estrita de linhas no `graft-lint`.

## [2026-11-21] Gestão de Equipe & PIN de PDV - Lote 5: Testes Unitários e Grafo
- Criados testes unitários em C# (`CriarOperadorUseCaseTests.cs` e `LoginOperadorPinUseCaseTests.cs`) com 12 novos cenários.
- Criada suíte de testes unitários frontend `equipeAndPinLogin.test.ts` cobrindo extração de erros e fluxos de PIN.
- Suíte completa de 246 testes backend executada com 100% de sucesso (0 falhas) e testes frontend 100% aprovados.
- Compilação limpa (`dotnet build` e `tsc --noEmit`) e grafo estrutural sincronizado via `graft build` (2530 nós, 2381 arestas).


## [2026-11-21] Backoffice SuperAdmin SaaS - Evolução UI/UX, Modais e Paginação da API
- Implementados filtros (`busca`, `status`) e paginação (`ConsultaTenantsAdminFiltro`, `TenantsAdminPaginadoDto`) em `ListarTenantsAdminUseCase` e `AdminController`.
- Criados modais do Design System: `ModalConfirmarSuspensao` (alerta de bloqueio do PDV em 2 toques) e `ModalEstenderTrial` (atalhos +7d, +14d, +30d e input numérico).
- Migrada lista para `<FlashList>` virtualizado, com chips interativos de filtro por status e `EmptyStateTenants` na `AdminBackofficeScreen`.
- Integrado feedback visual não-intrusivo via Toasts globais (`RealtimeEventToast`) nas operações administrativas.
- Validação completa com 247 testes unitários .NET aprovados, testes frontend `adminBackofficeFlow.test.ts` 100% OK, `tsc --noEmit` limpo e grafo sincronizado via `graft build` (2555 nós).


## [2026-11-21] AbortSignal Cooperativo - Lote 1: Camada de Rede Base & Interceptor
- Atualizado `apiClient.interceptors.response` para ignorar cancelamentos (`isCancel`, `ERR_CANCELED`, `CanceledError`, `AbortError`) sem marcar API offline.
- Atualizado `extractErrorMessage` e reexportado `isCancel` em `shared/services/api.ts` e `services/api.ts` para supressão limpa de mensagens de UI.
- Adicionados testes automatizados cobrindo cancelamento com `AbortController` e integridade do estado da conexão em `servicesErrorHandling.test.ts` (100% aprovados).


## [2026-11-21] AbortSignal Cooperativo - Lote 2: Propagação nos 11 Feature Services
- Propagado `signal?: AbortSignal` em todos os métodos dos 11 services de feature do frontend.
- Integrada guarda `if (isCancel(err)) throw err;` nos blocos de contingência mock para preservar cache e estado do React Query.
- Refatorado `authService.ts` garantindo 296 linhas (< teto de 300).
- Suíte de testes unitários frontend expandida com 6 novos cenários de cancelamento (100% de sucesso) e grafo estrutural sincronizado via `graft build` (2554 nós, 2430 arestas).


## [2026-11-21] AbortSignal Cooperativo - Lote 3: Injeção nos Hooks de Consulta (useQuery)
- Injetado `{ signal }` nativo do TanStack Query v5 na `queryFn` de todos os 9 hooks de leitura do frontend.
- Conectado cancelamento em voo nas mudanças de filtros (debounce de busca, abas, datas e chaves dinâmicas).
- Todos os hooks mantidos com menos de 190 linhas (abaixo do teto de 300) e 100% de testes unitários aprovados.


## [2026-11-21] AbortSignal Cooperativo - Lote 4: Hooks de Efeito Direto (useEffect com AbortController)
- Integrado `AbortController` com cancelamento no cleanup (`return () => controller.abort()`) em `usePerfil.ts` e `useHistoricoVendas.ts`.
- Adicionado controle de refetch seguro com descarte da requisição anterior em `useHistoricoVendas.ts`.
- Substituído `err: any` por `err: unknown` com supressão silenciosa em caso de aborto voluntário.


## [2026-11-21] AbortSignal Cooperativo - Lote 5: Hooks de Mutação (useMutation)
- Habilitado repasse opcional de `signal?: AbortSignal` em todas as mutações (`useRegistrarVenda`, `useFecharCaixa`, `useMovimentacaoCaixa`, `useCadastrarInsumo`, `useRegistrarBaixaEstoque`, `useRegistrarEntradaEstoque`, `useCriarProduto`, `useCadastroRestauranteMutation`, `useLoginMutation`).
- Eliminado uso de `error: any` no `useRegistrarVenda` com validação de cancelamento silencioso via `isCancel(error)`.
- Todos os hooks de mutação com menos de 100 linhas e 100% dos testes unitários passando.


## [2026-11-21] AbortSignal Cooperativo - Lote 6: Validação Final, Testes Automatizados e Grafo
- Suíte `servicesErrorHandling.test.ts` ampliada com cenários de cancelamento em queries e mutações (7/7 testes aprovados).
- Validação cruzada com todos os 247 testes unitários .NET do backend aprovados (0 falhas).
- Grafo estrutural reconstruído e consistente via `graft build` (2554 nós, 2438 arestas).

## [2026-11-21] Correção de Estilo Web, Migração CI Node 24 e Hardening de Segurança
- Removido shorthand `outline: 'none'` em `EsqueciSenhaScreen.styles.ts` e `ModalBloqueioTerminal.styles.ts`.
- Atualizado workflow CI para Node 24 nativo com actions atualizadas e `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`.
- Sanitizado log de OTP em `SolicitarRecuperacaoSenhaUseCase`, adicionado limitador de 5 tentativas com `FixedTimeEquals` em `RedisPasswordResetTokenService` e rate limiting estrito de recuperação.
- Restringido CORS com origens locais seguras / `ALLOWED_CORS_ORIGINS`; 248 testes .NET e frontend aprovados (PRs #22 e #23 mergeados).
