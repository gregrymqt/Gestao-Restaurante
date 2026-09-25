# Higiene de Contexto e Estratificação U-AMOS

## Estratificação Operacional da Memória (U-AMOS)

Para impedir o esgotamento prematuro do contexto e manter as regras inegociáveis permanentemente ativas, a memória do agente é dividida em 3 patamares:

```
+--------------------------------------------------------------------------+
| 1. HOT TIER (Residente Permanente: Teto 300 - 500 linhas)                |
| - context-map.md (Mapa estrutural do repositório)                        |
| - AGENTS.md (Regras inegociáveis fail-closed)                            |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| 2. WARM TIER (Carregado Sob Demanda: Módulos de até 300 linhas cada)     |
| - Contratos de interface e DTOs específicos da tarefa ativa              |
| - Registros de Decisões Arquiteturais (ADRs) relevantes                   |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| 3. COLD TIER (Armazenado em Disco / Invocado por Solicitação Explícita)  |
| - Postmortems de incidentes e histórico de refatorações                  |
| - Documentações arquivadas e padrões descontinuados                      |
+--------------------------------------------------------------------------+
```

---

## Teto Rígido de Densidade: 300 Linhas por Arquivo

Nenhum arquivo mantido na memória ativa ou documentação interna pode ultrapassar **300 linhas de texto**:
- Se um arquivo de mapeamento ou documentação crescer além de 300 linhas, ele deve ser imediatamente fatiado em submódulos orientados a funcionalidade (ex.: `context-map-backend.md`, `context-map-mobile.md`).
- Arquivos de código de produção que excedam 300 linhas exigem refatoração ou decomposição em serviços menores.

---

## Comandos de Higiene e Manutenção de Sessão

### 1. `/compact` (Compactação Ativa)
- **Gatilho:** Quando a sessão atingir aproximadamente 60% da janela de contexto ou após a conclusão de uma tarefa de grande porte.
- **Efeito:** Condensa conversas intermediárias, preserva o estado final e conclusões centrais, liberando espaço para novas instruções sem perda de fidelidade.

### 2. `/clear` (Reinício Limpo de Domínio)
- **Gatilho:** Ao alternar de domínio técnico (exemplo: migrar da modelagem de persistência PostgreSQL para animações no React Native ou treino de ML no Python).
- **Efeito:** Elimina o ruído residual acumulado, garantindo atenção total às regras do novo domínio.
