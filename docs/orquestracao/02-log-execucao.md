# Log de Execução

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
