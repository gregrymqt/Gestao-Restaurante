# Diretrizes do Agente - Sistema Restaurante Inteligente

Este repositório hospeda o sistema **Restaurante Inteligente**, composto por Backend em ASP.NET Core (.NET 9), App Móvel em React Native (TypeScript / Expo SDK 58), Worker/ML em Python 3.12 e Banco de Dados PostgreSQL 16, orquestrados via RabbitMQ e Redis Streams em modelo multi-inquilino segregado por `RestauranteId`.

---

## 1. Cláusulas Inegociáveis de Invalidação de Código

Qualquer código gerado que viole qualquer uma destas cláusulas é **completamente inválido**:

1. **Segregação Absoluta do Worker Python:**
   - É **estritamente proibida** a importação ou uso de bibliotecas de conexão a bancos relacionais (`asyncpg`, `psycopg2`, `SQLAlchemy`, etc.) no código Python.
   - O Python opera 100% desconectado do PostgreSQL, comunicando-se exclusivamente via RabbitMQ (`aio-pika`).
   - A ingestão de séries históricas e a persistência final de previsões na tabela `Previsoes` são tarefas exclusivas da API C# (.NET).

2. **Segurança Multi-Tenant em Dupla Camada:**
   - Toda consulta LINQ ou comando SQL deve estar restrito ao escopo do `RestauranteId`.
   - Camada 1: `IRestauranteEntity` e Global Query Filters (`HasQueryFilter`) no EF Core.
   - Camada 2: Políticas nativas de PostgreSQL Row-Level Security (RLS) habilitadas com `FORCE ROW LEVEL SECURITY`, acionadas via interceptor transacional executando `SET LOCAL app.current_restaurante_id = '{id}'`.

3. **Tipos Numéricos e Datas:**
   - Proibido o uso de tipos de ponto flutuante (`float`, `double`, `real`) para valores monetários ou quantidades de estoque. Utilizar universalmente `numeric(18,2)` para moeda e `numeric(18,4)` para insumos fracionados (no C#: `decimal`).
   - Todas as datas/horas devem ser mapeadas como `TIMESTAMPTZ` no banco e tratadas em UTC na aplicação (`DateTimeOffset`).

4. **Livro-Razão de Estoque Imutável (*Append-Only*):**
   - A tabela `MovimentacoesEstoque` nunca recebe `UPDATE` ou `DELETE`. Ajustes físicos ocorrem exclusivamente por novas inserções compensatórias (`Tipo = 'AJUSTE'`).
   - `Insumos.QuantidadeEstoque` é uma visão materializada aceleradora de leitura, mantida atomicamente com o ledger e auditável pela invariante de reconciliação de saldos.

5. **Disciplina Anti-Deadlock na Baixa de Insumos:**
   - Operações de baixa transacional de estoque devem obrigatoriamente expandir a ficha técnica (BOM), agrupar os volumes por insumo e ordenar deterministicamente por `InsumoId ASC` antes de requisitar qualquer bloqueio pessimista (`SELECT ... FOR UPDATE`).

6. **Arquitetura Limpa no Backend C# (.NET):**
   - O projeto `Domain` não referencia nenhum outro projeto.
   - Controllers recebem DTOs e chamam Use Cases/Handlers; nunca injetam `DbContext` diretamente.
   - Operações compostas de venda e baixa de estoque devem executar estritamente dentro de uma transação explícita de banco (`IDbContextTransaction`).

7. **Mensageria com Contratos Versionados e Resiliência (RabbitMQ):**
   - Payloads em JSON estritamente tipados e versionados (ex: `PrevisaoDemandaSolicitadaEvent_v1`).
   - Confirmação manual de consumo (`manual ack/nack`).
   - Topologia mandatória com Dead Letter Exchange (DLX) e Dead Letter Queue (DLQ).

8. **Frontend Desacoplado (React Native):**
   - Tipagem estrita (100% TypeScript) espelhando os DTOs do backend e camada de rede centralizada via `apiClient` com interceptors de JWT e ciclo de vida SaaS (Paywall).
   - Arquitetura Feature-First (Bounded Contexts): Funcionalidades de negócio residem estritamente sob `src/frontend/features/<nome>/` (`components/`, `hooks/`, `services/`, `types/`, barreira pública `index.ts`). Rotas em `app/` atuam estritamente como cascas finas de composição (*thin wrappers*).
   - Segregação Estrita de Responsabilidades (SRP): Componentes são visuais e declarativos; Hooks orquestram estado e reatividade; Services executam exclusivamente transporte de I/O via `apiClient`.
   - Alta Performance & Resiliência: Navegação exclusiva via `expo-router` Native Stack (`freezeOnBlur: true`), listas de alta volumetria com `<FlashList>` e persistência local via `MMKV`.
   - Normatização Local: Regras de micro-ergonomia (hitSlop 48×48dp, máscaras de input, formulários e teto estrito de 300 linhas por arquivo).

9. **Densidade de Tokens e Leitura Cirúrgica (Token-Density):**
   - Proibida a leitura integral de arquivos com mais de 100 linhas sem fatiamento cirúrgico (`StartLine` e `EndLine` delimitados a no máximo 80 linhas).
   - Aplicação obrigatória do padrão RTK para comandos de terminal (saídas > 30 linhas proibidas na memória ativa, resumidas no formato `[Status]`, `[Alvo]`, `[Erros]`).
   - Teto estrito de 300 linhas de texto para qualquer arquivo de documentação interna ou memória ativa.

10. **Navegação Determinística via Grafo do Repositório (Graft MCP/CLI):**
    - O repositório é indexado nativamente pelo **Graft** (MCP Server `graft` e CLI `graft`). É **mandatório** utilizar as ferramentas do Graft para localização de código, dependências e análise de impacto, sendo proibido o uso de buscas cegas.
    - Sincronização da árvore: sempre que novos arquivos forem criados ou excluídos, execute `graft build` para manter símbolos atualizados.

11. **Diretriz de Produto - Aplicativo Mobile Focado no Gestor:**
    - O aplicativo mobile é arquitetado para o **Dono / Gestor do Restaurante**.
    - A rota inicial (`app/(tabs)/index.tsx`) atua como **Dashboard Executivo de Operações & Decisão**, consolidando faturamento do dia, alertas reativos de estoque crítico (SSE), status do caixa e recomendações preditivas de compras da IA.

12. **Ciclo de Vida SaaS e Auto-Cadastro de Inquilinos (Tenants):**
    - Novos inquilinos entram via fluxo de auto-cadastro gerando seu próprio `RestauranteId` e usuário administrador/gestor.
    - Todo novo tenant recebe automaticamente 14 dias de degustação gratuita (`TrialPeriod`).
    - O acesso aos recursos é condicionado ao ciclo de vida da assinatura (`TRIAL`, `ATIVA`, `EXPIRADA`, `CANCELADA`), com interceptor de Paywall no frontend e checagem de vigência no backend.

13. **Segregação e Execução em Lotes Multi-Stack:**
    - Antes de editar código que atravesse múltiplas stacks (.NET, Python, React Native), decomponha a tarefa em lotes isolados de responsabilidade única (1: Contratos/Persistência .NET -> 2: Workers Python -> 3: Interface React Native -> 4: Governança/Validação Cruzada).
    - Portões de validação estritos: a transição entre lotes só ocorre após validação da camada atual via terminal silencioso.

14. **Governança de Plataforma SaaS e Backoffice SuperAdmin:**
    - O sistema segrega inquilinos locais (`Role = Manager/Owner`) de administradores da plataforma (`Role = SuperAdmin`).
    - Administradores da plataforma possuem acesso a endpoints administrativos no backend (`/api/v1/admin/*`).

---

<!-- inicializate-memory:start -->
## Recuperação de contexto e aprendizados

- Antes de investigar uma tarefa não trivial, consulte o mapa, a central e as notas pertinentes do Obsidian conforme as regras do usuário, além das entradas relevantes [do índice](.agents/memory/INDEX.md). Se a nota já estiver identificada, leia o trecho necessário; não releia o índice inteiro por rotina. Use janelas de até 80 linhas.
- Confirme pré-condições, versões e fontes atuais antes de reutilizar um procedimento. A memória orienta a investigação; evidência histórica não comprova o comportamento atual.
- Para localizar código, priorize o MCP Graft/Trail deste repositório: busca para símbolos, file_api para assinaturas e trace_calls para dependências, confirmando nomes e escopo das ferramentas. Comando, conexão, cobertura e alternativas estão no índice.
- Guarde aprendizados na nota existente do assunto, dentro da pasta da central mapeada pela raiz mais específica. Mantenha somente resumo com link na central e links no índice existente; preserve documentação operacional e registros anteriores.
- Diferencie ideia, hipótese, procedimento validado e registro superado; registre fonte/data e condições de validade. Repetição sem mudança reutiliza a entrada; correções humanas e evidências anteriores devem ser preservadas.
- Quando invocar `inicializate-memory`, resolva a skill instalada pelo catálogo e leia apenas a referência do modo solicitado. Inicialização depende de solicitação; registrar uma ideia não cria grafo, índice ou configuração MCP.
- Após mudanças no projeto, execute as verificações disponíveis antes de registrar resultados, conforme as regras do usuário. Sem mapeamento/acesso, informe a pendência sem cadastrar projeto ou declarar salvamento.
- Preserve instruções e correções humanas. Não instale dependências, atualize ferramentas ou altere configurações globais por implicação. Notas abaixo de 300 linhas; economia de tokens exige medição.
- **Fluxo Planner -> Executor:** O planejador (Antigravity) escreve planos atômicos em `docs/orquestracao/01-plano-atual.md` (ou `.ai/PLAN.md`). O executor lê `AGENTS.md` e o plano atual, executa os passos atômicos, roda os testes silenciosos e atualiza o status.

### Skills por tarefa

Use somente skills pertinentes e instaladas; resolva as globais pelo catálogo da sessão.

| Quando usar | Skill disponível | Referência |
| --- | --- | --- |
| Bots, sentinelas locais ou automação contínua a 0 tokens | `multi-tier-agent` | Scaffold idempotente de sentinela determinístico local em Python com UI web e inteligência sob demanda. |
| Navegação no grafo de código e blast radius | `graft` | Indexação estrutural, busca de símbolos, assinaturas de arquivo e chamadores antes de alterações. |
| Arquitetura backend, contratos de API e banco | `backend` | Engenharia de backend em camadas, contratos de API, dados/migrações, auth e mensageria. |
| Infraestrutura Azure, VM, Caddy e deploy | `azure-restaurante-inteligente` | Operação do ciclo de vida Azure (subir, backup verificado, teardown, Caddy TLS e CI/CD). |
| Homologação e testes mobile Android via ADB | `android-device-testing` | Conexão, reverse port forwarding, screenshots e inspeção ergonômica em aparelho físico ou emulador. |
| Especialistas pontuais (bug, SQL, backend, UI, UX) | `agency-specialists` | Roteamento para análises focadas e auditorias cirúrgicas por especialidade. |
| Diretrizes de frontend e design system | `modern-web-guidance` | Padrões de acessibilidade, componentes desacoplados e boas práticas de interface. |
| QA e testes automatizados de ponta a ponta | `qa-cypress-obsidian` | Automação e evidências estruturadas de testes de regressão no Obsidian. |
| Tarefa complexa com frentes independentes | `coordinated-subagents` | Consulte pelo catálogo; compare dependências, tempo e tokens. Sem calibração, use um agente ou piloto explicitamente autorizado. |
<!-- inicializate-memory:end -->
