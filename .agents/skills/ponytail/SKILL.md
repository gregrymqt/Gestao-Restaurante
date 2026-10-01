---
name: ponytail
description: >-
  Manual canônico de engenharia minimalista de código, aplicação da Escada YAGNI, priorização de recursos nativos e stdlib (.NET 9, Python 3.12, React Native/Expo SDK 54, PostgreSQL 16).
  Ative ao planejar, implementar, refatorar, revisar código ou selecionar dependências no sistema Restaurante Inteligente.
---

# Ponytail: Engenharia Minimalista de Código (`ponytail`)

Esta skill governa a eliminação sistemática de over-engineering, código supérfluo e abstrações prematuras no sistema **Restaurante Inteligente**, complementando a skill [token-density](../token-density/SKILL.md).

---

## 1. Cláusulas Inegociáveis de Engenharia Enxuta (Fail-Closed)

Qualquer código gerado que viole estas diretrizes é considerado **ineficiente e inválido**:

1. **PROIBIDO Over-Engineering de Abstração:**
   - Proibida a criação de interfaces com apenas uma implementação (exceto para mock de testes unitários em fronteiras externas de I/O).
   - Proibido o padrão Repository genérico sobre o `DbContext` do Entity Framework Core.
   - Proibida a introdução de camadas intermediárias de "Service" anêmicas que apenas repassam chamadas de Use Cases/Handlers para repositórios.

2. **PROIBIDA Adição de Dependências Supérfluas:**
   - Banida a instalação de bibliotecas externas para operações cobertas nativamente pela plataforma (.NET 9 BCL, Python 3.12 stdlib, React Native nativo ou SQL constraints).
   - Consulte obrigatoriamente a [Matriz de Plataforma Nativa](./references/platform_native_matrix.md) antes de propor qualquer pacote.

3. **SALVAGUARDAS INVIOLÁVEIS (Lazy, Not Negligent):**
   - É terminantemente proibido simplificar ou suprimir:
     1. Isolamento Multi-Tenant em Dupla Camada (`RestauranteId`, Global Filters e RLS).
     2. Imutabilidade do Livro-Razão de Estoque (*Append-Only* em `MovimentacoesEstoque`).
     3. Disciplina Anti-Deadlock na Baixa de Insumos (`InsumoId ASC` antes de `FOR UPDATE`).
     4. Segregação Absoluta do Worker Python (Zero bibliotecas SQL no Python).
     5. Tipos numéricos de alta precisão (`numeric(18,2)` para moeda e `numeric(18,4)` para estoque).

4. **INVESTIGAÇÃO MANDATÓRIA DA CAUSA RAIZ:**
   - Em correções de bugs, faça grep em todos os chamadores antes de propor a alteração. Corrija na raiz compartilhada, prevenindo correções pontuais que geram diffs redundantes.

---

## 2. A Escada de Decisão (The Ladder)

Diante de qualquer tarefa de código, pare no **primeiro degrau que resolver o problema**:

```text
1. Precisa existir?              → Não: ignore (YAGNI)
2. Já existe nesta base?         → Reutilize utilitários/tipos locais
3. A stdlib da linguagem cobre?  → Use a BCL (.NET) ou stdlib (Python/TS)
4. Recurso nativo da plataforma? → Use componentes nativos do React Native / SQL
5. Dependência já instalada?     → Reutilize pacotes já presentes no projeto
6. Pode ser feito em uma linha?  → Reduza a uma linha expressiva
7. Apenas então:                 → A menor quantidade de código novo robusto
```

Veja o guia com fluxo de decisão detalhado em [the_ladder.md](./references/the_ladder.md).

---

## 3. Matriz de Plataforma Nativa

Substitutos nativos diretos para as 4 stacks do nosso monorepo:
- **.NET 9 / C# 13:** `TimeProvider`, `FrozenDictionary`, `MemoryCache`, `PeriodicTimer`, LINQ direto.
- **Python 3.12:** `zoneinfo`, `dataclasses`, `functools`, `itertools`, Pydantic v2 nativo.
- **React Native / Expo SDK 54:** `<FlashList>`, `<Modal>`, `<TextInput>`, `Intl`, `URLSearchParams`.
- **PostgreSQL 16:** `CHECK constraints`, `UNIQUE`, RLS nativo, transactions explícitas.

Veja o catálogo completo em [platform_native_matrix.md](./references/platform_native_matrix.md).

---

## 4. Revisão Enxuta de Diffs e Débito Técnico

- **Revisão de Diffs:** Identifique e elimine inchaços usando o protocolo [review_and_audit.md](./references/review_and_audit.md).
- **Rastreamento de Débitos Conscientes:** Atalhos deliberados devem ser anotados com a tag `// ponytail: <limite>, <gatilho de refatoração>`. Veja [technical_debt_protocol.md](./references/technical_debt_protocol.md).

---

## 5. Formato de Saída (Zero-Fluff)

- Apresente o código funcional primeiro.
- Limite qualquer explicação posterior a no máximo 3 linhas de sinal técnico.
- Se a explicação for mais longa que o código gerado, resuma ou elimine a explicação.
