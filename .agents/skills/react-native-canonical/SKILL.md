---
name: react-native-canonical
description: >-
  Manual canônico anti-alucinação e diretrizes normativas para React Native (Expo SDK 54+),
  TypeScript estrito, expo-router, Zustand, MMKV, FlashList e validação em malha fechada.
  Ative esta skill ao desenvolver telas, componentes, hooks, navegação, chamadas de API ou estilização no app mobile.
---

# Diretrizes Canônicas Anti-Alucinação para React Native e Expo SDK 54+

Esta skill estabelece os parâmetros normativos, convenções arquiteturais, restrições operacionais e mecanismos determinísticos anti-alucinação para o desenvolvimento do aplicativo móvel da plataforma **Restaurante Inteligente** (`src/frontend`).

---

## 1. Cláusulas Inegociáveis de Invalidação de Código (Fail-Closed)

Qualquer código gerado que viole qualquer uma das seguintes cláusulas é **sumariamente inválido**:

1. **PROIBIDA Contaminação Web/DOM:**
   - É **terminantemente vedado** o uso de tags HTML/Web (`<div>`, `<span>`, `<p>`, `<a>`, `<button>`, `<img>`) ou propriedades de layout incompatíveis como `display: grid`.
   - Utilizar universalmente as primitivas nativas do React Native: `<View>`, `<Text>`, `<Pressable>`, `<TextInput>`, `<Image>`.

2. **PROIBIDO Texto Não Empacotado (`no-raw-text`):**
   - É proibida a inserção de strings literais diretamente dentro de nós `<View>` sem estarem contidas em um componente `<Text>` ou abstrações tipadas (`ThemedText`), prevenindo a exceção nativa fatal `Invariant Violation: Text strings must be rendered within a <Text> component`.

3. **PROIBIDAS Dependências Fantasma:**
   - É vedada a importação de bibliotecas que não constem expressamente no manifesto `package.json` do projeto. Novas dependências devem ser adicionadas exclusivamente via `npx expo install`.

4. **PROIBIDO Uso de Pacotes e Padrões Descontinuados:**
   - Proibido o uso de `expo-av`, `expo-permissions`, `@react-native-async-storage/async-storage`, `@expo/vector-icons`, `ScrollView` para listas dinâmicas e `Animated.timing` sem cleanup. Consulte a [tabela de substitutos obrigatórios](./references/banned_and_mandatory_stack.md).

5. **PROIBIDA Quebra de Tipagem TypeScript:**
   - Todo componente, hook, função utilitária ou DTO deve possuir tipagem estrita (100% TypeScript, `noImplicitAny: true`). Proibido inventar propriedades de componentes nativos ou parâmetros de navegação que não existam nos contratos formais.

6. **PROIBIDOS Estilos Inline Dinâmicos:**
   - Proibido o uso de objetos literais inline no prop `style` (`style={{ ... }}`) para componentes renderizados em loops ou frequentemente atualizados, prevenindo alocações cíclicas de memória e recalculos na thread de UI. Usar sempre `StyleSheet.create` ou design tokens pré-compilados.

---

## 2. Hierarquia Inviolável de Regras de Codificação

Quando houver tensão entre diferentes exigências técnicas, o agente deve seguir estritamente a seguinte ordem soberana de precedência:

1. **Nível 1 (Máxima Precedência) - Regras de Segurança:**
   - Proibição de inclusão de chaves secretas ou credenciais em código cliente.
   - Isolamento de rede: injeção obrigatória do Bearer Token JWT via interceptors centrais do Axios, com leitura síncrona segura no storage nativo (`MMKV`).
2. **Nível 2 - Regras Arquiteturais:**
   - Aderência estrita à Nova Arquitetura do React Native (Fabric, TurboModules, Hermes).
   - Organização modular orientada a funcionalidades (*feature-first*).
   - Roteamento com `expo-router` e rotas tipadas (`expo-router/typed-routes`).
   - Sincronização de dados do servidor via TanStack Query com polling resiliente.
3. **Nível 3 - Regras de Estilo:**
   - Aderência aos Design Tokens da aplicação (cores, tipografia, espaçamentos).
   - Centralização de estilos com `StyleSheet.create` sem propriedades órfãs (`no-unused-styles`).
4. **Nível 4 - Preferências Individuais:**
   - Convenções cosméticas e comentários explicativos.

---

## 3. Gestão de Memória em Camadas (Padrão U-AMOS)

Para combater o desvanecimento de atenção (*instruction fade-out*), a skill estrutura o contexto do agente em 3 patamares:

- **Hot Tier (300-500 linhas):** Permanece residente no contexto durante todas as sessões. Contém o [Context Map](./references/memory_tiers_and_context_map.md) com a topologia de diretórios e contratos essenciais.
- **Warm Tier (1.500-3.000 linhas):** Injetado sob demanda por tópicos funcionais (ADRs, design tokens, interfaces de rede espelhando o backend C#).
- **Cold Tier (disco):** Arquivo estático em disco de decisões técnicas passadas, postmortems e rotinas de manutenção.

---

## 4. Ciclo de Validação em Malha Fechada (Closed-Loop Feedback)

Antes de persistir fisicamente qualquer arquivo `.ts` ou `.tsx` no disco, o agente deve submeter o código aos seguintes portões de contenção:

1. **Compilação Virtual em Memória:**
   - Verificação de tipos via TypeScript Compiler API virtual (`ts.CompilerHost`), validando contratos contra `node_modules` e o `tsconfig.json` real sem poluir o disco.
   - Caso haja erros diagnósticos (Props inválidas, tipos incompatíveis), efetuar até 3 ciclos de autocorreção em memória.
2. **Auditoria AST via ESLint:**
   - `react-native/no-raw-text`: impede strings sem nó `<Text>`.
   - `react-native/no-unused-styles`: expurga declarações não utilizadas em `StyleSheet.create`.
   - `react-native/no-inline-styles`: bloqueia objetos de estilo inline.
3. Consulte [closed_loop_validation.ts](./references/closed_loop_validation.ts) para detalhes de implementação.

---

## 5. Referências Canônicas

- [banned_and_mandatory_stack.md](./references/banned_and_mandatory_stack.md): Lista negra detalhada de bibliotecas obsoletas e substitutos obrigatórios no Expo SDK 54+.
- [memory_tiers_and_context_map.md](./references/memory_tiers_and_context_map.md): Topologia de memória do agente e modelo de `context-map.md`.
- [feature_first_structure.md](./references/feature_first_structure.md): Estrutura de pastas formal baseada em features.
- [api_client_resilience.ts](./references/api_client_resilience.ts): Cliente Axios centralizado com JWT síncrono via MMKV, Keyset Pagination e polling de previsões de demanda com TanStack Query.
- [design_tokens_and_primitives.tsx](./references/design_tokens_and_primitives.tsx): Componentes primitivos tipados (`ThemedText`, `ThemedView`) e tokens de design.
