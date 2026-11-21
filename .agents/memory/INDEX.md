# Contexto de Restaurante-Inteligente

Este índice aponta às fontes canônicas; confirme o estado atual antes de reutilizar aprendizados.

## Fontes e aprendizados

- [README.md](../../README.md): Visão geral do monorepo, stack tecnológica (.NET 9, Python 3.12, React Native/Expo SDK 58, Postgres 16 RLS) e instruções de execução local e Docker.
- [SCHEMA_BANCO.md](../../SCHEMA_BANCO.md): Dicionário de dados, modelos de entidades, políticas RLS e regras do livro-razão (ledger) de estoque.
- [infra/README.md](../../infra/README.md): Guia de infraestrutura Azure VM, scripts de ciclo de vida (subir, backup com hash SHA256, restaurar e destruir), Caddyfile e Terraform.
- Destino canônico dos aprendizados no Obsidian: [Projetos](file:///C:/Users/digob/Documents/Obsidian/Projetos)
- Nota central e pasta do projeto: [Restaurante-Inteligente.md](file:///C:/Users/digob/Documents/Obsidian/Projetos/Restaurante-Inteligente.md)
- Mapeamento confirmado: `C:/Users/digob/Documents/Obsidian/Mapa de Projetos.md` (Linha 9: `Restaurante-Inteligente` mapeado para `C:\Users\digob\Documents\Projetos\Gestao-Restaurante`)
- Guarde o conteúdo na nota do assunto e mantenha aqui apenas links e orientação curta. Diferencie ideia, hipótese, procedimento validado e registro superado; registre fonte/data e condições de validade sem duplicar notas ou mover documentação operacional.

## Grafo e MCP

- Ferramenta/versão: Graft v0.21.1 (`@nanonets/graft` via Node.js)
- Comando na raiz e cache: `graft build` e `graft check`; cache estrutural em `/graft/` (ignorado no `.gitignore`)
- Cobertura, validação e limites: 2.165 nós e 1.936 arestas sincronizados sobre 430 arquivos de código-fonte (.NET, Python, React Native/TS). Camada profunda conceitual (`--deep`) pendente de chave LLM opcional; grafo estrutural e chamadores 100% validados.
- Configuração MCP: Servidor MCP `graft` unificado em [.mcp.json](../../.mcp.json) na raiz do repositório (comando stdio `graft mcp`).
- Protocolo e ferramentas: Conexão stdio expõe ferramentas `graft_find_code`, `graft_trace_calls`, `graft_file_api`, `graft_repo_map` e `graft_find_all`. Descoberta ativa depende do runtime do agente; CLI `graft` opera como fallback imediato.

## Verificação

- Data, verificações e resultados: 18/11/2026. `git ls-files` confirmou 505 arquivos rastreados; `graft check` retornou status `OK` (0 divergências); 208 testes unitários .NET e 9 suítes frontend TypeScript registradas em verde no histórico recente.
- Rotas e restrições: [AGENTS.md](../../AGENTS.md).
