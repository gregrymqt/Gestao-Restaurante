# Guia Operacional de Leitura Cirúrgica (Surgical Windowing)

## O Problema do Carregamento Cego

Carregar arquivos de código extensos na janela de contexto acarreta três prejuízos graves:
1. **Lost in the Middle:** Informações críticas no meio de grandes blocos de código são desconsideradas pelo modelo de atenção.
2. **Instruction Fade-Out:** As regras do sistema e as restrições inegociáveis perdem peso relativo diante de milhares de tokens irrelevantes.
3. **Esgotamento Prematuro de Janela:** Reduz o número útil de turnos de diálogo e força compactações frequentes.

---

## Fluxo Metodológico em 3 Etapas

```
[1. Localizar Símbolo] ----> [2. Calcular Janela] ----> [3. Inspecionar Fatia]
 (AST / LSP / grep)           (Max 80 linhas)            (view_file cirúrgico)
```

### Etapa 1: Localização Prévia sem Carregar o Arquivo
Antes de ler o código, execute uma busca pontual de assinaturas para identificar as linhas exatas do método ou classe:
```powershell
# PowerShell: Localiza a linha exata da definição
Select-String -Path "src/backend/EstoqueService.cs" -Pattern "ProcessarBaixaEstoque"
```

### Etapa 2: Cálculo da Janela Operacional
- Identificado o início na linha 142, define-se a janela:
  - `StartLine = 140`
  - `EndLine = 195` (delta = 55 linhas, < 80 linhas).

### Etapa 3: Invocação Delimitada da Ferramenta
```json
{
  "AbsolutePath": "c:/Users/digob/Desktop/Gestao-Restaurante/src/backend/EstoqueService.cs",
  "StartLine": 140,
  "EndLine": 195
}
```

---

## Regras e Limites Rígidos

| Tamanho do Arquivo | Ação Autorizada | Parâmetros Obrigatórios |
| :--- | :--- | :--- |
| **< 100 linhas** | Leitura em bloco único autorizada | Omitir `StartLine`/`EndLine` permitido se necessário |
| **100 a 500 linhas** | Fatiamento cirúrgico mandatório | `StartLine` e `EndLine` com delta $\le 80$ linhas |
| **> 500 linhas** | Proibida leitura sem identificação prévia | Busca obrigatória de símbolo antes de qualquer leitura |
