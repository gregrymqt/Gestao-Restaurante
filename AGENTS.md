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

9. **Densidade de Tokens e Leitura Cirúrgica (Token-Density):**
   - Proibida a leitura integral de arquivos com mais de 100 linhas sem fatiamento cirúrgico (`StartLine` e `EndLine` delimitados a no máximo 80 linhas).
   - Aplicação obrigatória do padrão RTK para comandos de terminal (saídas > 30 linhas proibidas na memória ativa, resumidas no formato `[Status]`, `[Alvo]`, `[Erros]`).
   - Teto estrito de 300 linhas de texto para qualquer arquivo de documentação interna ou memória ativa.

---

## 2. Skills do Projeto

- [postgres-canonical](.agents/skills/postgres-canonical/SKILL.md): Diretrizes normativas de PostgreSQL 16, DDL formal, infraestrutura Docker/WAL, baixa anti-deadlock e interceptor RLS.
- [dotnet-backend-canonical](.agents/skills/dotnet-backend-canonical/SKILL.md): Diretrizes normativas de Backend em .NET 9 (C# 13), Clean Architecture, DDD, MassTransit Raw JSON, resiliência HTTP e Keyset Pagination.
- [python-ml-worker-canonical](.agents/skills/python-ml-worker-canonical/SKILL.md): Diretrizes normativas de Machine Learning e Workers em Python 3.12, aio-pika com DLX/DLQ, Pydantic V2, Feature Engineering e HistGradientBoosting.
- [react-native-canonical](.agents/skills/react-native-canonical/SKILL.md): Diretrizes normativas anti-alucinação para React Native e Expo SDK 54+, expo-router, Zustand, MMKV, FlashList e validação em malha fechada.
- [token-density](.agents/skills/token-density/SKILL.md): Diretrizes canônicas de densidade de tokens, leitura cirúrgica por janela (Surgical Windowing) e padrão RTK.




