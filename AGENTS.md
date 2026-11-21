# Diretrizes do Agente - Sistema Restaurante Inteligente

> [!IMPORTANT]
> **Auto-Adaptação de Runtime:**
> Esta configuração é agnóstica de modelo. Ao lê-la, identifique suas ferramentas nativas disponíveis (MCPs declarados em `.mcp.json`, CLI, filesystem, subagentes) e adapte automaticamente a execução destas diretrizes ao seu próprio ambiente, sem exigir arquivos de configuração específicos por provedor.

Repositório do **Restaurante Inteligente**: Backend ASP.NET Core (.NET 9), App Mobile React Native (TypeScript / Expo SDK 58), Worker/ML Python 3.12 e PostgreSQL 16, orquestrados via RabbitMQ e Redis Streams em modelo multi-tenant segregado por `RestauranteId`.

---

## 1. Cláusulas Inegociáveis de Invalidação de Código

Qualquer código que viole estas cláusulas é **inválido**:

1. **Worker Python Desconectado do Banco:** Proibido importar/usar bibliotecas SQL (`asyncpg`, `psycopg2`, `SQLAlchemy`) no Python. Comunicação exclusivamente via RabbitMQ (`aio-pika`). Ingestão histórica e persistência na tabela `Previsoes` são exclusivas da API .NET.
2. **Multi-Tenant em Dupla Camada:** Toda consulta/comando deve restringir `RestauranteId` via: (1) `IRestauranteEntity` + `HasQueryFilter` no EF Core; (2) PostgreSQL RLS com `FORCE ROW LEVEL SECURITY` e interceptor transacional executando `SET LOCAL app.current_restaurante_id = '{id}'`.
3. **Tipos Numéricos e Datas:** Proibido `float`, `double` ou `real` para moeda ou estoque. Usar `numeric(18,2)` (moeda) e `numeric(18,4)` (insumos) no banco, e `decimal` no C#. Datas em `TIMESTAMPTZ` (UTC) no banco e `DateTimeOffset` na aplicação.
4. **Ledger de Estoque Imutável:** `MovimentacoesEstoque` é *append-only* (nunca `UPDATE` ou `DELETE`; ajustes apenas via novas inserções `Tipo = 'AJUSTE'`). `Insumos.QuantidadeEstoque` é visão materializada mantida atomicamente.
5. **Anti-Deadlock na Baixa de Insumos:** Expandir ficha técnica (BOM), agrupar volumes por insumo e ordenar por `InsumoId ASC` antes de bloqueios pessimistas (`SELECT ... FOR UPDATE`).
6. **Clean Architecture (.NET):** `Domain` não referencia outros projetos. Controllers recebem DTOs e chamam Use Cases/Handlers (nunca injetam `DbContext`). Venda + baixa de estoque exigem transação explícita (`IDbContextTransaction`).
7. **Mensageria RabbitMQ:** Contratos JSON tipados e versionados (ex: `PrevisaoDemandaSolicitadaEvent_v1`), confirmação manual (`manual ack/nack`) e topologia com DLX/DLQ.
8. **Frontend React Native:**
   - 100% TypeScript espelhando DTOs do backend; rede centralizada via `apiClient` (interceptors JWT + Paywall SaaS).
   - Estrutura Feature-First em `src/frontend/features/<nome>/` (`components/`, `hooks/`, `services/`, `types/`, `index.ts`); `app/` apenas como *thin wrappers*.
   - SRP estrito: Componentes visuais, Hooks de estado, Services de I/O.
   - `expo-router` Native Stack (`freezeOnBlur: true`), listas com `<FlashList>`, persistência com `MMKV`, hitSlop 48×48dp, máscaras de input e teto de **300 linhas por arquivo**.
9. **Economia de Tokens e Terminal:** Proibido ler arquivos > 100 linhas por inteiro (fatiar `StartLine`/`EndLine` em janelas de até 80 linhas). Saídas de terminal > 30 linhas devem ser resumidas no formato `[Status]`, `[Alvo]`, `[Erros]`. Teto de 300 linhas para docs/memória.
10. **Navegação via Grafo (Graft):** Proibido buscas cegas (`grep` amplo/leitura exploratória). Use sempre o MCP/CLI `graft` para localizar código, dependências e impacto, e rode `graft build` ao criar/excluir arquivos.
11. **Foco Mobile no Gestor:** `app/(tabs)/index.tsx` é o Dashboard Executivo (faturamento do dia, alertas SSE de estoque crítico, status do caixa e compras preditivas da IA).
12. **Ciclo SaaS e Tenants:** Auto-cadastro gera `RestauranteId` + usuário gestor com 14 dias de `TrialPeriod`. Acesso validado pelos status `TRIAL`, `ATIVA`, `EXPIRADA`, `CANCELADA` (Paywall no app e checagem no backend).
13. **Execução em Lotes Multi-Stack:** Decompor tarefas cross-stack em lotes isolados (`1: .NET` -> `2: Python` -> `3: React Native` -> `4: Validação`), validando via terminal antes de avançar.
14. **Governança SaaS:** Segregar inquilinos (`Manager/Owner`) de administradores da plataforma (`SuperAdmin` em `/api/v1/admin/*`).
15. **Configuração de MCPs:** Antes de invocar servidores MCP ou ferramentas externas, consulte `.mcp.json` na raiz para respeitar os servidores, escopos e parâmetros configurados no repositório.

---

<!-- inicializate-memory:start -->
## Memória, Fluxo e Skills

- **Contexto:** Antes de tarefas não triviais, consulte `.agents/memory/INDEX.md` (janelas ≤ 80 linhas) e notas pertinentes do Obsidian. Confirme versões/fontes antes de reutilizar procedimentos.
- **Registro:** Salve aprendizados na nota existente da central correspondente (≤ 300 linhas), diferenciando hipótese de procedimento validado, com fonte/data. Preserve correções humanas; não instale dependências globais sem pedido.
- **Planner -> Executor:** O planejador grava planos atômicos em `docs/orquestracao/01-plano-atual.md` (ou `.ai/PLAN.md`). O executor lê `AGENTS.md` + plano, executa os passos, roda testes silenciosos e atualiza o status.

### Skills Disponíveis (usar sob demanda)

| Escopo | Skill |
| --- | --- |
| Grafo de código, símbolos e blast radius | `graft` |
| Arquitetura .NET, APIs, banco, auth e mensageria | `backend` |
| Infra Azure, VM, Caddy TLS, backups e CI/CD | `azure-restaurante-inteligente` |
| Testes mobile Android via ADB / emulador | `android-device-testing` |
| Acessibilidade, componentes e UI React Native | `modern-web-guidance` |
| Auditorias cirúrgicas (bug, SQL, backend, UI/UX) | `agency-specialists` |
| Testes E2E e regressão no Obsidian | `qa-cypress-obsidian` |
| Sentinelas locais Python a 0 tokens | `multi-tier-agent` |
| Tarefas complexas com frentes paralelas | `coordinated-subagents` |
<!-- inicializate-memory:end -->

<!-- graft:start -->
## Graft — Repo Context Graph

O repositório é indexado em `graft/` (`graft/INDEX.md`). Use sempre o grafo antes de abrir arquivos:
- `graft map`: visão geral de clusters e hubs.
- `graft ask "<pergunta>" --source`: busca semântica com trechos exatos (`--in <scope>/` para filtrar; `--full` para definição completa).
- `graft grep "<literal>"`: busca exaustiva agrupada por símbolo.
- `graft skeleton <arquivo>`: assinaturas e linhas de um arquivo.
- `graft callers <simbolo>` (`--direction out`, `--depth N`): rastreia chamadores e impacto.
- `graft build`: atualiza o índice após mudanças estruturais.
<!-- graft:end -->
