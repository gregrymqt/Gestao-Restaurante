# Plano Atual: PIN de Terminal e Recuperação de Senha (Esqueceu a Senha)

Status: Concluído
Data: 2026-11-21

## 1. Contexto e Invariantes
- Autenticação e bloqueio de terminal via PIN de 4 a 6 dígitos com persistência segura (`PinHash`) no PostgreSQL.
- Tratamento do fluxo de troca de operador ou saída mantendo o caixa fiscal aberto no restaurante.
- Recuperação de senha completa com OTP de 6 dígitos temporário (15 min) persistido no Redis e nova tela progressiva no app mobile.
- Obediência estrita às Cláusulas de `AGENTS.md`:
  - Multi-tenant e RLS com isolamento por `RestauranteId`.
  - Hashing seguro PBKDF2 via `IPasswordHasher` para senhas e PINs.
  - Revogação de sessão via Blacklist de tokens no Redis no logout.
  - Feature-First no frontend (`features/auth`, `features/perfil`), sem chamadas diretas ou lógica espalhada.

---

## 2. Tarefas Atômicas de Execução

### Lote 1: Domínio e Persistência Backend C# (.NET 9)
- [x] Atualizar entidade `Usuario.cs` em `src/RestauranteInteligente.Domain/Entities/Usuario.cs:L10-L51`:
  - Adicionar propriedade `public string? PinHash { get; private set; }`.
  - Atualizar construtor para receber `string? pinHash = null`.
  - Adicionar método `public void DefinirPin(string novoPinHash)`.
- [x] Atualizar mapeamento EF Core em `src/RestauranteInteligente.Infrastructure/Persistence/Configurations/UsuarioConfiguration.cs:L25-L40`:
  - Configurar `builder.Property(u => u.PinHash).HasMaxLength(255).IsRequired(false);`.
- [x] Atualizar contrato `IUsuarioRepository.cs` em `src/RestauranteInteligente.Domain/Common/Interfaces/IUsuarioRepository.cs:L8-L14`:
  - Adicionar `Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default);`.
  - Adicionar `Task AtualizarAsync(Usuario usuario, CancellationToken ct = default);`.
- [x] Implementar métodos em `src/RestauranteInteligente.Infrastructure/Persistence/Repositories/UsuarioRepository.cs:L10-L60`:
  - Implementar `ObterPorIdAsync` com `.IgnoreQueryFilters()`.
  - Implementar `AtualizarAsync` chamando `_context.Usuarios.Update` e `SaveChangesAsync`.
- [x] Adicionar gerador de chave Redis em `src/RestauranteInteligente.Infrastructure/Redis/RedisKeyHelper.cs:L25-L32`:
  - Adicionar método `BuildPasswordResetKey(string email) => $"auth:password_reset:{email.Trim().ToLowerInvariant()}";`.

### Lote 2: Endpoints e Casos de Uso Backend C# (.NET 9)
- [x] Adicionar DTOs de autenticação em `src/RestauranteInteligente.Api/DTOs/Auth/TerminalPinAndPasswordResetDtos.cs`:
  - `ValidarPinRequest(string Pin);`
  - `DefinirPinRequest(string NovoPin);`
  - `EsqueciSenhaRequest(string Email);`
  - `RedefinirSenhaRequest(string Email, string CodigoOtp, string NovaSenha);`
- [x] Criar interface `IPasswordResetTokenService.cs` no domínio e implementação `RedisPasswordResetTokenService.cs` na infraestrutura.
- [x] Implementar Use Cases em `src/RestauranteInteligente.Application/Auth/UseCases/`:
  - `ValidarPinTerminalUseCase.cs`
  - `DefinirPinTerminalUseCase.cs`
  - `SolicitarRecuperacaoSenhaUseCase.cs`
  - `RedefinirSenhaUseCase.cs`
- [x] Implementar endpoints limpos em `src/RestauranteInteligente.Api/Controllers/AuthController.cs`:
  - `POST /api/v1/auth/validar-pin`: invoca `ValidarPinTerminalUseCase`.
  - `POST /api/v1/auth/definir-pin`: invoca `DefinirPinTerminalUseCase`.
  - `POST /api/v1/auth/esqueci-senha`: invoca `SolicitarRecuperacaoSenhaUseCase`.
  - `POST /api/v1/auth/redefinir-senha`: invoca `RedefinirSenhaUseCase`.
- [x] Criar testes unitários em `tests/RestauranteInteligente.UnitTests/AuthControllerTests.cs` e `AuthUseCasesTests.cs`.
- [x] Executar validação silenciosa de compilação e testes (234 testes aprovados com 100% de sucesso).

### Lote 3: Serviços e Componentes Frontend (React Native / Expo SDK 58)
- [x] Adicionar métodos em `src/frontend/features/auth/services/authService.ts`:
  - `validarPin(pin: string): Promise<boolean>` conectando a `POST /auth/validar-pin`.
  - `definirPin(novoPin: string): Promise<void>` conectando a `POST /auth/definir-pin`.
  - `solicitarRecuperacaoSenha(email: string): Promise<{ message: string }>` conectando a `POST /auth/esqueci-senha`.
  - `redefinirSenha(email: string, codigoOtp: string, novaSenha: string): Promise<{ message: string }>` conectando a `POST /auth/redefinir-senha`.
  - `logout(): Promise<void>` conectando a `POST /auth/logout`.
- [x] Atualizar `ModalBloqueioTerminal.tsx` em `src/frontend/features/perfil/components/ModalBloqueioTerminal.tsx`:
  - Adicionado suporte a validação assíncrona com estado de carregamento e mensagem de erro específica.
  - Mantido o botão "Trocar de Operador ou Sair" disparando `onLogout`.
- [x] Atualizar `usePerfil.ts` em `src/frontend/features/perfil/hooks/usePerfil.ts`:
  - Conectado `handleDesbloquearTerminal` à chamada `authService.validarPin(pin)`.
  - Atualizado `handleLogout` para invocar `await authService.logout()`, limpar o storage com `logout()` e navegar para `/(auth)/login`.
- [x] Atualizar `CredentialsCard.tsx` em `src/frontend/features/auth/components/CredentialsCard.tsx`:
  - Conectado link "Esqueceu a senha?" para executar `router.push('/(auth)/esqueci-senha')`.
- [x] Criar tela `EsqueciSenhaScreen.tsx` em `src/frontend/features/auth/screens/EsqueciSenhaScreen.tsx`:
  - Etapa 1: Inserção de e-mail e envio de código OTP.
  - Etapa 2: Inserção de OTP (6 dígitos), nova senha com confirmação e chamada de redefinição.
- [x] Criar rota wrapper em `src/frontend/app/(auth)/esqueci-senha.tsx` e registrar em `src/frontend/app/(auth)/_layout.tsx`.
- [x] Exportar `EsqueciSenhaScreen` em `src/frontend/features/auth/index.ts`.
- [x] Validar compilação e tipagem do frontend (`npx tsc --noEmit`) e teste unitário em `authTerminalAndReset.test.ts`.

### Lote 4: Validação Cruzada e Atualização do Grafo
- [x] Executar `graft build` para sincronizar os novos símbolos e chamadas na árvore (2460 nós, 2280 arestas).
- [x] Registrar evidências e logs em `docs/orquestracao/02-log-execucao.md`.
