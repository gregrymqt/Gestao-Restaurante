# Arquitetura Orientada a Funcionalidades (Feature-First Pattern)

## Princípios de Organização

A arquitetura **Feature-First** agrupa todos os artefatos relacionados a um domínio funcional específico no mesmo diretório, evitando dispersão entre pastas genéricas de "componentes", "hooks" e "telas".

```
features/<nome-da-feature>/
├── components/          # Componentes visuais exclusivos desta funcionalidade
├── hooks/               # Custom hooks de orquestração de estado e queries
├── types/               # Contratos e DTOs TypeScript (espelhando o backend C#)
├── services/            # Funções de requisição HTTP especializadas
└── index.ts             # Ponto único de exportação pública (evita acoplamento interno)
```

---

## Exemplo Canônico: Feature `previsoes`

```
features/previsoes/
├── components/
│   ├── PrevisaoCard.tsx             # Card de produto com demanda prevista vs baseline
│   ├── PrevisaoStatusBadge.tsx      # Indicador visual (Processando, Concluído, Falha)
│   └── PrevisoesFlashList.tsx       # Lista virtualizada com @shopify/flash-list
├── hooks/
│   └── usePrevisaoDemanda.ts        # Hook TanStack Query com polling exponencial
├── types/
│   └── previsao.types.ts            # DTOs: PrevisaoDemandaResponseDto, StatusPrevisao
├── services/
│   └── previsoesApi.ts              # getPrevisaoPorId, solicitarNovaPrevisao
└── index.ts                         # Exportações limpas: export * from './hooks/usePrevisaoDemanda'
```

---

## Regras de Isolamento entre Features

1. **Dependência Hierárquica:** Uma feature só pode importar de outra feature através de seu `index.ts` público. Proibido importar arquivos internos profundos (ex: `import ... from '../features/estoque/components/internals/Item'`).
2. **Componentes Universais:** Se um componente visual for compartilhado por mais de duas features (ex: `Button`, `ThemedText`, `CardBase`), ele deve ser promovido para a pasta global `components/primitives/`.
3. **Contratos DTO:** Interfaces que espelham respostas da API C# devem residir em `types/` e ser imutáveis (`readonly`), preservando a fidelidade com os `records` do C#.
