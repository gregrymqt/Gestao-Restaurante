# Matriz de Substituição de Recursos Nativos (Platform Native Matrix)

Esta matriz mapeia utilitários redundantes frequentemente introduzidos por modelos de IA para seus substitutos nativos diretos nas 4 tecnologias centrais do nosso monorepo.

---

## 1. Backend C# (.NET 9 / C# 13)

| Dependência / Prática Ineficiente | Substituto Nativo da BCL / .NET 9 | Benefício / Racional |
| :--- | :--- | :--- |
| `NodaTime` para relógio mockável | `TimeProvider` nativo da BCL | Testabilidade nativa sem dependências extras. |
| `System.Collections.Immutable` | `System.Collections.Frozen` (`ToFrozenDictionary`) | Leituras O(1) ultra-otimizadas para lookups estáticos. |
| Repositório genérico (`IRepository<T>`) | Injeção de `AppDbContext` em Use Case | Elimina abstração anêmica inútil sobre o EF Core. |
| Classes utilitárias com getters manuais | C# 13 `record class` / `record struct` com primary constructors | Redução de 80% do boilerplate de DTOs e Value Objects. |
| Polling manual com `Thread.Sleep` | `PeriodicTimer` assíncrono | Zero bloqueio de thread pool em background workers. |
| `Newtonsoft.Json` para payloads | `System.Text.Json` (STJ) nativo | Zero alocação com source generators e streaming. |

---

## 2. Worker & ML (Python 3.12)

| Dependência / Prática Ineficiente | Substituto Nativo Python 3.12 | Benefício / Racional |
| :--- | :--- | :--- |
| `pytz` ou manipulação manual de timezone | `zoneinfo` e `datetime.timezone.utc` | Suporte nativo da biblioteca padrão do Python 3.9+. |
| Classes com `__init__`, `__repr__` manuais | `@dataclass(slots=True, frozen=True)` | Código limpo, imutabilidade e menor consumo de memória. |
| Funções auxiliares de cache local | `@functools.lru_cache` ou `@functools.cache` | Cache em memória nativo em 1 linha sem bibliotecas de terceiro. |
| Validações manuais com `if isinstance(...)` | Modelos Pydantic v2 nativos | Serialização e validação em Rust de alta performance. |
| Conexão a banco SQL no Python | **TERMINANTEMENTE PROIBIDO** (Cláusula 1) | Worker comunica exclusivamente via RabbitMQ (`aio-pika`). |

---

## 3. Frontend Mobile (React Native / Expo SDK 54)

| Dependência / Prática Ineficiente | Substituto Nativo React Native / Expo | Benefício / Racional |
| :--- | :--- | :--- |
| Bibliotecas pesadas de DatePicker | `<input type="date">` (web) ou controle modal nativo simples | Economiza megabytes no bundle e bugs de renderização. |
| `lodash` / `underscore` | Métodos nativos de `Array.prototype` e `Object.*` (ES2024) | `find`, `filter`, `flatMap`, `reduce` nativos em V8/Hermes. |
| Bibliotecas externas de formatação de moeda | `Intl.NumberFormat('pt-BR', { style: 'currency' })` | Formatação nativa de alta velocidade suportada no Hermes. |
| `@react-navigation/stack` (JS) | `expo-router` com Native Stack (`react-native-screens`) | Transições 60/120 FPS renderizadas pelo SO, não pela thread JS. |
| ScrollViews longos não-virtualizados | `<FlashList>` com `estimatedItemSize` | Reciclagem de células com zero stutter e alto throughput. |

---

## 4. Banco de Dados (PostgreSQL 16)

| Lógica em Código de Aplicação | Substituto Nativo PostgreSQL 16 | Benefício / Racional |
| :--- | :--- | :--- |
| Validações manuais de valor positivo | `CHECK (quantidade >= 0)` | Integridade atômica no motor de dados; impossível corromper. |
| Checagem de duplicação via `SELECT COUNT` | `UNIQUE INDEX (restaurante_id, nome)` | Garante unicidade mesmo sob alta concorrência sem race condition. |
| Filtros manuais de tenant em toda query SQL | `FORCE ROW LEVEL SECURITY` + Policies nativas | Camada física inexpugnável no motor do banco. |
| Deleção lógica simulada via booleanos | Livro-Razão *Append-Only* com registros compensatórios | Rastreabilidade fiscal e auditoria financeira instantânea. |
