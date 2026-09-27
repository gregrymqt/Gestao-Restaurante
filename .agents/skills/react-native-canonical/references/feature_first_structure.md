# Arquitetura Orientada a Funcionalidades (Feature-First Pattern & Bounded Contexts)

## 1. Princípios de Organização e Bounded Contexts

O aplicativo móvel segue o modelo **Feature-First** estrito, onde cada funcionalidade de negócio opera como um **Bounded Context** isolado dentro de `src/frontend/features/<nome-da-feature>/`.

Essa abordagem impede a dispersão caótica de código e garante que regras de negócio, dados tipados e interface gráfica permaneçam coesos e desacoplados:

```
features/<nome-da-feature>/
├── components/          # Componentes visuais exclusivos desta funcionalidade
├── hooks/               # Custom hooks de orquestração de estado e queries (TanStack Query / Zustand)
├── services/            # Funções de requisição HTTP especializadas (consumindo axios client central)
├── types/               # Contratos e DTOs TypeScript estritos (espelhando o backend C#)
└── index.ts             # Ponto único de exportação pública (barreira formal de encapsulamento)
```

---

## 2. Responsabilidades Estritas por Camada

| Subpasta | Papel Arquitetural | O que DEVE Conter | O que é PROIBIDO Conter |
| :--- | :--- | :--- | :--- |
| **`components/`** | Apresentação Visual | Componentes visuais específicos da feature, estilizados via `StyleSheet.create`. | Chamadas diretas de rede (`axios.get`), estados globais ou DTOs inline. |
| **`hooks/`** | Orquestração & Negócio | Hooks de consulta/mutação (TanStack Query), seletores de estado (Zustand) e lógica de tela. | JSX/Renderização de views ou tags primitivas de UI. |
| **`services/`** | Infraestrutura de I/O | Métodos de chamada de API tipados invocando o cliente HTTP centralizado (`apiClient`). | Estados locais de React (`useState`), renderização ou navegação. |
| **`types/`** | Domínio e Contratos | Tipos estritos TypeScript, interfaces DTO `readonly` espelhando `records` da API C#. | Implementações de funções ou código executável em runtime. |
| **`index.ts`** | Encapsulamento Público | Exportações explícitas dos componentes e hooks destinados a consumo externo (rotas e outras features). | Exportação de detalhes de implementação interna que pertençam unicamente ao domínio da feature. |

---

## 3. Padrão Mandatório: Rotas como Cascas Finas (*Thin Route Wrappers*)

O diretório `src/frontend/app/` utiliza o **`expo-router`** exclusivamente para roteamento baseado em arquivos. As rotas **NÃO** contêm lógica de negócio, chamadas de rede ou componentes complexos. Elas atuam unicamente como cascas finas (*thin wrappers*) delegando para as features correspondentes:

### Exemplo de Rota Fina (`src/frontend/app/(tabs)/previsoes.tsx`):
```tsx
import React from 'react';
import { PrevisoesScreen } from '@/features/previsoes';

export default function PrevisoesRoute() {
  return <PrevisoesScreen />;
}
```

---

## 4. Navegação Nativa de Alta Performance (`expo-router`)

Para garantir máxima fluidez de interface (60/120 FPS), consumo mínimo de RAM e inicialização rápida (*Time to Interactive* - TTI):

1. **Native Stack Obrigatório:** Utilizar a primitiva `<Stack>` do `expo-router` operada nativamente via `react-native-screens` (`UINavigationController` no iOS e `Fragment` no Android).
2. **Code-Splitting Nativo por Rota:** O Metro empacota e carrega sob demanda cada tela de rota em `app/`, reduzindo drasticamente o tamanho do bundle inicial executado na inicialização da VM Hermes.
3. **Congelamento e Descarte de Telas em Background:**
   - Telas e abas fora de foco devem ser congeladas (`freezeOnBlur: true`) ou desanexadas da hierarquia nativa (`detachInactiveScreens: true`).
   - Evita re-renderizações e consultas de rede em abas que o operador não está visualizando no momento.
4. **Rotas 100% Tipadas:** Manter tipagem estrita via `expo-router/typed-routes`, impedindo erros em tempo de execução causados por URLs ou parâmetros inválidos.

---

## 5. Regras de Isolamento e Não-Contaminação

1. **Dependência Hierárquica Estrita:** Uma feature só pode consumir recursos de outra feature através de seu `index.ts` público. É sumariamente proibido importar submódulos internos (ex.: `import { Item } from '../features/estoque/components/Item'`).
2. **Promoção para Primitivas Globais:** Se um componente visual for reutilizado por mais de dois domínios (ex.: `Button`, `ThemedText`, `CardBase`), ele deve ser promovido para `components/primitives/`.
3. **Contratos Imutáveis:** Interfaces DTO em `types/` devem declarar todas as propriedades como `readonly`, garantindo correspondência simétrica com a imutabilidade dos modelos C# do backend.
