# Diretrizes do Agente - Frontend Mobile (Expo / React Native)

Este módulo hospeda o aplicativo mobile do **Restaurante Inteligente**, arquitetado com **Expo SDK 54+ / 57**, **React Native 0.86**, **React 19** e **100% TypeScript**, focado no **Dono / Gestor do Restaurante**.

---

## 1. Comandos Padronizados do Módulo

Utilize estritamente `npm` e `npx` (este repositório não utiliza Bun, Yarn ou pnpm):

```bash
npx expo start                    # Inicia o servidor de desenvolvimento Expo
npx tsc -p tsconfig.json --noEmit # Validação obrigatória de tipagem estrita (Portão de Qualidade)
npx expo install <package>        # OBRIGATÓRIO para instalar pacotes compatíveis com o SDK Expo
```

> [!IMPORTANT]
> **Validação de Malha Fechada**: Execute obrigatoriamente `npx tsc -p tsconfig.json --noEmit` antes de concluir qualquer tarefa ou declarar sucesso em alterações de frontend.

---

## 2. Arquitetura de Diretórios e Roteamento

- **Rotas (`app/`):** Utilizam `expo-router` com Native Stack (`react-native-screens` com `freezeOnBlur: true`). As telas em `app/` atuam **estritamente como cascas finas de composição (*thin wrappers*)**. É proibida lógica de negócio pesada, chamadas diretas de API ou JSX complexo dentro de `app/`.
- **Funcionalidades de Negócio (`features/<nome>/`):** Seguem arquitetura Feature-First rigorosa (Bounded Contexts: `admin`, `assinatura`, `auth`, `caixa`, `dashboard`, `estoque`, `perfil`, `previsoes`, `vendas`).
  - Estrutura interna mandatória: `components/`, `hooks/`, `services/`, `types/` e `index.ts`.
  - **Barreira Pública:** Importações entre features distintas devem ocorrer estritamente através da barreira pública `features/<nome>/index.ts`. É proibido importar subarquivos internos de outras features.

---

## 3. Segregação de Responsabilidades (SRP) & Teto de Linhas

1. **Componentes (`components/`):**
   - Puramente visuais e declarativos. Proibida lógica de transporte HTTP ou chamadas diretas de rede.
   - **Teto de Complexidade:** Limite estrito de **no máximo 350 linhas por arquivo `.tsx`**. Componentes que atinjam esse limite devem ser decompostos em subcomponentes modulares na pasta `components/`.
2. **Hooks (`hooks/`):**
   - Orquestram estado local/global (Zustand) e reatividade. Proibidas requisições HTTP inline (`axios`/`fetch`); delegar estritamente para `services/`.
3. **Services (`services/`):**
   - Executam exclusivamente transporte de I/O via `apiClient`. Proibido o uso de JSX ou React Hooks.

---

## 4. Ergonomia Mobile, UX & Sanitização

- **Alvos de Toque:** Controles interativos devem ter alvo de toque mínimo de **48×48dp** (`hitSlop` ou padding). Alternadores de visibilidade usam ícones vetoriais padronizados (`Eye`/`EyeOff`), banindo emojis.
- **Formulários:** Formulários com múltiplos campos devem ser encapsulados em `KeyboardAvoidingView` adaptativo (`iOS: padding`, `Android: height`) com `ScrollView` configurado com `keyboardShouldPersistTaps="handled"`.
- **Máscaras e Seletores:** Entidades fiscais (CNPJ/CPF) devem possuir máscara em tempo real. Campos de domínio fechado (ex: UF) devem usar seletores modais com busca, vedada digitação livre.
- **Listas de Alta Volumetria:** Usar universalmente `<FlashList>` com `estimatedItemSize` e filtragem em tempo real para insumos, produtos e entidades dinâmicas.
- **Blindagem Vocabular:** Proibida terminantemente a exibição de termos técnicos de backend/infraestrutura (ex: "Multi-Tenant", "RLS", "PostgreSQL", "Worker", "Broker") na interface. Utilizar vocabulário funcional de negócio (ex: "Online", "Conexão Segura", "Filiais", "Recomendações da IA").
