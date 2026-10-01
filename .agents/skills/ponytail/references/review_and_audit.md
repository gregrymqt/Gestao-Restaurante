# Protocolo de Revisão e Auditoria Cirúrgica (review_and_audit)

Este protocolo orienta o agente a auditar *git diffs* ou arquivos recém-editados procurando por sintomas de inchaço (*over-engineering*).

---

## 1. As 5 Tags de Corte Ponytail

Ao revisar um diff ou propor refatoração, classifique as oportunidades de simplificação utilizando as seguintes tags:

- `delete:` Código morto, comentado, logs de debug esquecidos ou métodos auxiliares sem nenhum chamador ativo.
- `stdlib:` Código manual ou pacote de terceiro que pode ser integralmente substituído por uma chamada da biblioteca padrão da linguagem (.NET BCL, Python stdlib, JS ES2024).
- `native:` Dependência externa que pode ser substituída por uma primitiva do SO, navegador, React Native nativo ou constraint do banco de dados.
- `yagni:` Abstrações prematuras, fábricas desnecessárias, interfaces sem múltiplos polimorfismos ou opções de configuração que nunca variam.
- `shrink:` Simplificação mecânica de lógica condicional (ex: converter cascatas de `if/else` em pattern matching ou dicionários imutáveis).

---

## 2. Formato de Relatório de Revisão

Quando solicitado a revisar uma alteração ou diff, emita o parecer no formato condensado:

```text
[REVISÃO PONYTAIL]
- delete: src/backend/.../OldHelper.cs (sem chamadores após migração)
- native: substituído pacote externo por <input type="date"> nativo
- yagni: removida interface IOrderFactory de implementação única
- shrink: simplificado handler de 65 linhas para 22 linhas usando LINQ

[SALDO]: net: -74 linhas possíveis mantendo 100% de segurança e testes.
```

Se o código já estiver na sua expressão mínima e segura, encerre com:
```text
[REVISÃO PONYTAIL]: Lean already. Ship.
```
