# A Escada de Decisão do Ponytail (The Ladder)

A Escada de Decisão é a heurística central que orienta a escolha do menor caminho técnico funcional. Pare no primeiro degrau que satisfizer o requisito.

---

## Degrau 1: Precisa Existir? (YAGNI)
- **Princípio:** *"You Aren't Gonna Need It"*. A necessidade é hipotética ou voltada a um futuro incerto?
- **Ação:** Não escreva. Pule a implementação e justifique em 1 linha: *"Omitido: sem requisito atual para X"*.
- **Anti-padrões banidos:** Configurações genéricas para valores que nunca mudam, factories para produtos únicos, endpoints CRUD antecipados sem telas consumidoras.

---

## Degrau 2: Já Existe na Base de Código?
- **Princípio:** O erro mais comum em bases de dados assistidas por IA é reimplementar helpers que já residem em arquivos vizinhos.
- **Ação:** Antes de codificar uma função utilitária ou hook, execute busca (`grep`) por identificadores semelhantes em `src/shared/`, `src/frontend/features/*/services/` ou `src/backend/*/Common/`.
- **Regra:** Reutilize tipos e funções compartilhadas antes de criar novidades.

---

## Degrau 3: A Biblioteca Padrão (Stdlib) Resolve?
- **Princípio:** As runtimes modernas (.NET 9 BCL, Python 3.12 stdlib, TypeScript/ES2024) já oferecem primitivas de alta performance para tarefas rotineiras.
- **Ação:** Use métodos padrão da plataforma antes de procurar utilitários de terceiros.
- **Exemplo:** Usar `TimeProvider.System.GetUtcNow()` em C# ou `datetime.now(timezone.utc)` em Python em vez de libs legadas de manipulação temporal.

---

## Degrau 4: Recurso Nativo da Plataforma Cobre?
- **Princípio:** O banco de dados ou o sistema operacional executam tarefas de integridade e renderização com ordens de magnitude a mais de eficiência do que código de aplicação.
- **Ação:** Delegue unicidade para `UNIQUE constraint` no PostgreSQL em vez de checar manualmente via query prévia; use `<TextInput secureTextEntry>` nativo no React Native em vez de emuladores JS.

---

## Degrau 5: Dependência Já Instalada Cobre?
- **Princípio:** Cada pacote externo traz risco de quebra de versão, vulnerabilidade e atraso no build.
- **Ação:** Nunca adicione pacotes ao `package.json`, `.csproj` ou `pyproject.toml` se uma biblioteca já instalada ou poucas linhas de código resolverem.

---

## Degrau 6: Pode Ser Feito em Uma Linha?
- **Princípio:** Evite cerimônias excessivas de controle de fluxo quando uma expressão pura (LINQ, list comprehension, ternário) resolve com clareza.
- **Ação:** Mantenha a legibilidade, mas sintetize o código em uma única linha funcional.

---

## Degrau 7: Apenas Então: A Menor Quantidade de Código que Funciona
- **Princípio:** Se nenhum degrau anterior cobriu o problema, escreva o código estritamente necessário.
- **Ação:** Zero abstrações desnecessárias. O código deve ser direto, seguro e com cobertura mínima de verificação.
