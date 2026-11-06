## 📌 Descrição do Pull Request

<!-- Descreva de forma concisa as alterações introduzidas neste PR -->

---

## 🛡️ Checklist Obrigatório de Qualidade (Quality Gate)

Antes de solicitar a revisão e realizar o merge para a branch `main`, certifique-se de que os seguintes critérios foram cumpridos:

- [ ] **Backend .NET 9:**
  - [ ] A solução compila sem erros nem warnings (`dotnet build -c Release`).
  - [ ] Todos os testes unitários foram executados e aprovados (`dotnet test`).
  - [ ] Cláusulas multi-tenant e RLS foram respeitadas.
  - [ ] Não há regressão no ledger de estoque (*append-only*) ou baixa BOM.

- [ ] **Worker ML Python 3.12:**
  - [ ] Cláusula Inegociável 1 (*Zero-SQL*) rigorosamente cumprida (nenhum driver relacional importado).
  - [ ] Todos os testes da suíte `pytest` passaram com êxito.

- [ ] **Frontend React Native:**
  - [ ] Checagem estrita de tipos do TypeScript aprovada (`npx tsc --noEmit`).
  - [ ] Testes unitários do frontend aprovados (`npx tsx --test __tests__/*.test.ts`).

- [ ] **Contêineres Docker:**
  - [ ] As imagens `Dockerfile` da WebApi e do Worker ML compilam via Docker Buildx.

---

## 🧪 Status da CI
> O job `quality-gate` da Action `CI/CD Pipeline` deve estar verde para autorizar o merge na branch `main`.
