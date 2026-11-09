# Diretrizes do Agente - Sistema Restaurante Inteligente

Este repositório hospeda o sistema **Restaurante Inteligente**, composto por Backend em ASP.NET Core (.NET 8/9), App Móvel em React Native (TypeScript), Worker/ML em Python e Banco de Dados PostgreSQL 16, orquestrados via RabbitMQ em modelo multi-inquilino segregado por `RestauranteId`.

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
   - Segregação Estrita de Responsabilidades (SRP): Componentes são visuais e declarativos (nunca acople chamadas de rede diretas ou serviços em componentes); Hooks orquestram estado e reatividade (sem chamadas HTTP inline); Services executam exclusivamente transporte de I/O via `apiClient` (sem JSX ou hooks).
   - Alta Performance & Resiliência: Navegação exclusiva via `expo-router` Native Stack (`react-native-screens` com `freezeOnBlur: true`), listas de alta volumetria com `<FlashList>` e persistência local via `MMKV`.
   - Normatização Local: Regras de micro-ergonomia (hitSlop 48×48dp, máscaras de input, formulários e teto estrito de 300 linhas por arquivo de componente/hook/service) estão normatizadas localmente em `src/frontend/AGENTS.md` e na skill `react-native-canonical`.


9. **Densidade de Tokens e Leitura Cirúrgica (Token-Density):**
   - Proibida a leitura integral de arquivos com mais de 100 linhas sem fatiamento cirúrgico (`StartLine` e `EndLine` delimitados a no máximo 80 linhas).
   - Aplicação obrigatória do padrão RTK para comandos de terminal (saídas > 30 linhas proibidas na memória ativa, resumidas no formato `[Status]`, `[Alvo]`, `[Erros]`).
   - Teto estrito de 300 linhas de texto para qualquer arquivo de documentação interna ou memória ativa.

10. **Navegação Determinística via Grafo do Repositório (Graft MCP/CLI):**
    - O repositório é indexado nativamente pelo **Graft** (MCP Server `graft` e CLI `graft`). É **mandatório** utilizar as ferramentas do Graft para localização de código, dependências e análise de impacto, sendo **estritamente proibido** o uso de comandos de busca cega (`findstr`, `grep` bruto, etc.).
    - Ferramentas canônicas do Graft via MCP:
      - `graft_find_code`: Localização semântica ranqueada com código inlined ("como X funciona", "onde está Y").
      - `graft_find_all`: Busca exaustiva de todas as ocorrências de um símbolo no monorepo.
      - `graft_trace_calls`: Rastreamento de chamadores (*callers*), chamados (*callees*) e raio de impacto (*blast radius*) antes de alterar contratos ou refatorar métodos.
      - `graft_file_api`: Esqueleto e assinaturas completas da API de um arquivo (~200 tokens) sem poluir o contexto.
      - `graft_repo_map`: Orientação arquitetural e sitemap estrutural do projeto.
    - **Sincronização Obrigatória da Árvore:** Sempre que um novo arquivo for criado, renomeado ou excluído no repositório, o agente deve executar imediatamente `graft build` para manter o grafo e a árvore de símbolos permanentemente sincronizados.

11. **Diretriz de Produto - Aplicativo Mobile Focado no Gestor:**
    - O aplicativo mobile é arquitetado para o **Dono / Gestor do Restaurante**.
    - A rota inicial (`app/(tabs)/index.tsx`) atua como **Dashboard Executivo de Operações & Decisão**, consolidando faturamento do dia, alertas reativos de estoque crítico (SSE), status do caixa e recomendações preditivas de compras da IA. O PDV de balcão é uma funcionalidade secundária/auxiliar de testes.

12. **Ciclo de Vida SaaS e Auto-Cadastro de Inquilinos (Tenants):**
    - Novos inquilinos entram via fluxo de auto-cadastro gerando seu próprio `RestauranteId` e usuário administrador/gestor.
    - Todo novo tenant recebe automaticamente 14 dias de degustação gratuita (`TrialPeriod`).
    - O acesso aos recursos é condicionado ao ciclo de vida da assinatura (`TRIAL`, `ATIVA`, `EXPIRADA`, `CANCELADA`), com interceptor de Paywall no frontend e checagem de vigência no backend.

13. **Segregação e Execução em Lotes Multi-Stack (Anti-Context Bloat e Anti-Alucinação):**
    - Sempre que uma tarefa demandar alterações que atravessem mais de uma camada tecnológica (ex: C#/.NET, Python/ML e React Native/Frontend), é **terminantemente proibido** misturar edições entre stacks no mesmo passo ou tentar resolver todas as camadas em uma única passagem.
    - **Declaração Prévia Obrigatória:** Antes de editar qualquer código, o agente deve anunciar explicitamente a decomposição da tarefa em lotes isolados de responsabilidade única segundo a ordem canônica de dependência:
      1. *Lote 1 (Contratos e Persistência):* Modelos de banco, migrações, Use Cases e endpoints na API .NET (C#).
      2. *Lote 2 (Workers e Eventos):* Consumers RabbitMQ, modelos Pydantic e lógica de processamento no Worker Python.
      3. *Lote 3 (Interface e Consumo):* Tipos TypeScript, services, hooks e componentes no React Native.
      4. *Lote 4 (Governança e Validação Cruzada):* Execução de testes de integração, verificação de malha fechada e checagem de impacto via `graft_trace_calls`.
    - **Portões de Validação Estritos (Gates):** A transição entre lotes só é permitida após validação mandatória da camada atual via terminal (ex: compilação com `dotnet build` para C#, validação de sintaxe/testes para Python e verificação de tipos/lint para React Native). Se houver qualquer falha ou erro de compilação, é terminantemente proibido tocar no lote seguinte até a resolução completa do problema no escopo atual.
    - **Isolamento de Contexto:** Durante a execução de um lote, o agente deve restringir sua leitura e escrita estritamente aos diretórios da respectiva stack, prevenindo contaminação de contexto e alucinações por excesso de responsabilidade.

14. **Governança de Plataforma SaaS e Backoffice SuperAdmin:**
    - O sistema segrega inquilinos locais (`Role = Manager/Owner`) de administradores da plataforma (`Role = SuperAdmin`).
    - Administradores da plataforma possuem acesso a endpoints administrativos no backend (`/api/v1/admin/*`) com permissão para listar inquilinos, auditar faturamentos, estender períodos de degustação e gerenciar planos através de uma interface visual dedicada, sem necessidade de manipulação manual via CLI ou SQL.
