# Gestão Estratificada de Memória (U-AMOS) e Context Map

## Arquitetura de Memória em Três Patamares

```
+--------------------------------------------------------------------------+
| HOT TIER (Residente Permanente: 300 - 500 linhas)                        |
| - context-map.md (Topologia do repositório mobile)                       |
| - Dependências essenciais instaladas (package.json inspecionado)         |
| - Cláusulas inegociáveis de código (Fail-Closed)                         |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| WARM TIER (Injetado sob Demanda: 1.500 - 3.000 linhas)                  |
| - Design Tokens e catálogo de componentes compartilhados                 |
| - Contratos de API (DTOs espelhando o backend C#)                        |
| - Registros de Decisões Arquiteturais (ADRs mobile)                      |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| COLD TIER (Arquivo em Disco / Histórico Ilimitado)                       |
| - Postmortems de bugs e red screens superados                            |
| - Relatórios de auditoria e decisões de refatoração                      |
| - Padrões de código rejeitados formalmente                               |
+--------------------------------------------------------------------------+
```

---

## Modelo Canônico de `context-map.md` (Hot Tier)

```markdown
# Context Map: Restaurante Inteligente Mobile (Expo SDK 54+)

## Raiz: src/frontend/

### app/ (Roteamento File-Based via expo-router)
- app/_layout.tsx                -> Provedores globais (QueryClientProvider, AuthProvider, ThemeProvider)
- app/(auth)/login.tsx           -> Fluxo de autenticação e obtenção do JWT
- app/(tabs)/_layout.tsx         -> Configuração das abas inferiores
- app/(tabs)/index.tsx           -> Dashboard operacional (resumo de vendas e status do caixa)
- app/(tabs)/cardapio.tsx        -> Listagem de produtos e ficha técnica rápida
- app/(tabs)/estoque.tsx         -> Monitoramento de insumos e alertas de ruptura
- app/(tabs)/previsoes.tsx       -> Painel de previsões de demanda geradas por ML
- app/pedidos/novo.tsx           -> Ponto de venda (PDV) móvel com baixa de estoque

### features/ (Arquitetura Feature-First)
- features/auth/                 -> useAuth, authStore (Zustand + MMKV), DTOs de login
- features/vendas/               -> useRegistrarVenda, PDV components, lista de itens
- features/estoque/              -> useInsumos, useMovimentacoesKeyset (FlashList)
- features/previsoes/            -> usePrevisaoDemanda (Polling com TanStack Query)

### components/ (Primitivas e UI Compartilhada)
- components/primitives/         -> ThemedText, ThemedView, Button, Input (Strict Props)
- components/feedback/           -> LoadingState, ErrorBoundary, RedScreenFallback

### services/ (Camada de Rede)
- services/api.ts                -> Instância centralizada do Axios com interceptor de JWT via MMKV
- services/storage.ts            -> Wrapper de leitura/gravação síncrona do react-native-mmkv
```
