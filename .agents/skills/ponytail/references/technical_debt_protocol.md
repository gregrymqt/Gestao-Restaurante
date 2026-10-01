# Protocolo de Débito Técnico Consciente (technical_debt_protocol)

O Ponytail incentiva soluções simples, mas não descuidadas. Quando um atalho técnico for tomado deliberadamente para acelerar a entrega ou simplificar o código (ex: paginação simples em memória em vez de keyset pagination complexa para uma tabela pequena), esse atalho **deve ser explicitamente rotulado**.

---

## 1. Padrão da Tag de Anotação

Insira um comentário de linha única imediatamente acima do bloco simplificado:

```csharp
// ponytail: suporta até 500 registros em memória, migrar para Keyset se volume > 5k/dia
```

```python
# ponytail: lock em memória no worker único, migrar para distributed lock Redis se escalar para multi-workers
```

```typescript
// ponytail: filtro simples no cliente para lista pequena (< 100 itens), paginar no servidor se crescer
```

---

## 2. Estrutura Obrigatória da Tag

A anotação deve conter dois elementos essenciais separados por vírgula:
1. **O Teto/Limite Conhecido:** Até onde a solução simples opera com segurança e performance aceitável.
2. **O Gatilho de Refatoração:** A condição mensurável exata que tornará obrigatória a expansão da arquitetura.

---

## 3. Mineração de Débitos

Qualquer agente ou desenvolvedor pode auditar os atalhos vigentes na base de código através de um comando simples de busca:

```powershell
Get-ChildItem -Path src -Recurso | Select-String "ponytail:"
```

Isso garante que simplificações intencionais nunca sejam esquecidas ou se transformem em bombas-relógio ocultas na aplicação.
