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
   - Camada de rede centralizada via Axios/Fetch com interceptors para injeção de JWT.
   - Tipagem forte (100% TypeScript) espelhando os DTOs do backend.
   - Tratamento de assincronismo (polling ou SignalR) para operações disparadas via mensageria.
   - Arquitetura Feature-First (Bounded Contexts): Todas as funcionalidades de negócio residem estritamente sob `src/frontend/features/<nome>/` contendo as subpastas `components/`, `hooks/`, `services/`, `types/` e barreira pública `index.ts` (vedados imports internos entre features). As rotas em `app/` atuam estritamente como cascas finas de composição (*thin wrappers*).
   - Segregação Estrita de Responsabilidades (SRP): Componentes são puramente visuais e declarativos (vedada lógica de transporte ou chamadas diretas de API); Hooks orquestram estado e reatividade (vedadas requisições HTTP inline `axios/fetch`, delegando estritamente para `services/`); Services executam exclusivamente o transporte de I/O via `apiClient` (vedado uso de JSX ou hooks do React).
   - Teto de Complexidade por Componente: Limite estrito de no máximo 350 linhas por arquivo de componente (`.tsx`). Componentes que atinjam ou superem esse limite devem ser obrigatoriamente decompostos em subcomponentes modulares na pasta `components/`.
   - Navegação Nativa de Alta Performance: Adoção exclusiva de `expo-router` com Native Stack (`react-native-screens`), rotas tipadas (`expo-router/typed-routes`), code-splitting automático por rota e congelamento de telas em background (`freezeOnBlur: true`). Banido o uso de navegadores JS (`@react-navigation/stack`).

9. **Densidade de Tokens e Leitura Cirúrgica (Token-Density):**
   - Proibida a leitura integral de arquivos com mais de 100 linhas sem fatiamento cirúrgico (`StartLine` e `EndLine` delimitados a no máximo 80 linhas).
   - Aplicação obrigatória do padrão RTK para comandos de terminal (saídas > 30 linhas proibidas na memória ativa, resumidas no formato `[Status]`, `[Alvo]`, `[Erros]`).
   - Teto estrito de 300 linhas de texto para qualquer arquivo de documentação interna ou memória ativa.

10. **Navegação Determinística via Grafo de Conhecimento (`graph.json`):**
    - É **mandatório** consultar o Grafo de Conhecimento em `.agents/graph.json` e o sumário executivo em `.agents/GRAPH_REPORT.md` para busca de arquivos, tipos, dependências e conexões entre camadas antes de realizar buscas cegas ou explorações recursivas no monorepo.
    - O grafo indexa deterministicamente os nós (`DatabaseTable`, `SecurityPolicy`, `ApiController`, `UseCase`, `CoreRepository`, `MassTransitConsumer`, `MessageQueue`, `FastAPIService`, `PythonWorker`, `FrontendPage`, `FrontendFeature`, `FrontendHook`, `FrontendService`, `DockerContainer`) e suas conexões semânticas (`calls_endpoint`, `invokes`, `queries`, `writes_to`, `consumes_from`, `publishes_to`, `protects`, `references`, `subscribes_sse`).
    - Sempre que novas rotas, tabelas, use cases, consumers ou telas forem criados ou alterados, mantenha o grafo sincronizado executando: `py .agents/scripts/generate_knowledge_graph.py`.

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
      4. *Lote 4 (Governança e Grafo):* Sincronização mandatória do Grafo de Conhecimento (`graph.json`).
    - **Portões de Validação Estritos (Gates):** A transição entre lotes só é permitida após validação mandatória da camada atual via terminal (ex: compilação com `dotnet build` para C#, validação de sintaxe/testes para Python e verificação de tipos/lint para React Native). Se houver qualquer falha ou erro de compilação, é terminantemente proibido tocar no lote seguinte até a resolução completa do problema no escopo atual.
    - **Isolamento de Contexto:** Durante a execução de um lote, o agente deve restringir sua leitura e escrita estritamente aos diretórios da respectiva stack, prevenindo contaminação de contexto e alucinações por excesso de responsabilidade.

14. **Governança de Plataforma SaaS e Backoffice SuperAdmin:**
    - O sistema segrega inquilinos locais (`Role = Manager/Owner`) de administradores da plataforma (`Role = SuperAdmin`).
    - Administradores da plataforma possuem acesso a endpoints administrativos no backend (`/api/v1/admin/*`) com permissão para listar inquilinos, auditar faturamentos, estender períodos de degustação e gerenciar planos através de uma interface visual dedicada, sem necessidade de manipulação manual via CLI ou SQL.

---

## 2. Skills do Projeto

- [postgres-canonical](.agents/skills/postgres-canonical/SKILL.md): Diretrizes normativas de PostgreSQL 16, DDL formal, infraestrutura Docker/WAL, baixa anti-deadlock e interceptor RLS.
- [dotnet-backend-canonical](.agents/skills/dotnet-backend-canonical/SKILL.md): Diretrizes normativas de Backend em .NET 9 (C# 13), Clean Architecture, DDD, MassTransit Raw JSON, resiliência HTTP e Keyset Pagination.
- [python-ml-worker-canonical](.agents/skills/python-ml-worker-canonical/SKILL.md): Diretrizes normativas de Machine Learning e Workers em Python 3.12, aio-pika com DLX/DLQ, Pydantic V2, Feature Engineering e HistGradientBoosting.
- [react-native-canonical](.agents/skills/react-native-canonical/SKILL.md): Diretrizes normativas anti-alucinação para React Native e Expo SDK 54+, expo-router, Zustand, MMKV, FlashList e validação em malha fechada.
- [token-density](.agents/skills/token-density/SKILL.md): Diretrizes canônicas de densidade de tokens, leitura cirúrgica por janela (Surgical Windowing) e padrão RTK.




