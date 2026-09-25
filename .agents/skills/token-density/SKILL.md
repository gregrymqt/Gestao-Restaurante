---
name: token-density
description: >-
  Manual canônico de engenharia de contexto, densidade de tokens, leitura cirúrgica (Surgical Windowing)
  e padrão RTK para prevenção de alucinações e instruction fade-out.
  Ative esta skill ao inspecionar arquivos extensos, executar comandos de terminal, editar código ou gerenciar contexto.
---

# Diretrizes Canônicas de Densidade de Tokens e Engenharia de Contexto (`token-density`)

Esta skill governa o consumo rigoroso de tokens, previne a degradação de atenção (*Lost in the Middle* e *instruction fade-out*) e impõe limites mecânicos na leitura, edição e execução de comandos pelo agente.

---

## 1. Cláusulas Inegociáveis de Invalidação de Operação (Fail-Closed)

Qualquer ação do agente que viole qualquer uma das seguintes regras é considerada **ineficiente e inválida**:

1. **PROIBIDA Leitura Cega de Arquivos (> 100 linhas):**
   - É terminantemente vedada a leitura de arquivos integrais com mais de 100 linhas (`cat` ou `view_file` sem argumentos de fatiamento).
   - O agente deve primeiro localizar os identificadores via mapa de símbolos (AST, LSP ou grep de assinaturas).
   - A leitura deve utilizar estritamente janelas de **no máximo 80 linhas** (`StartLine` e `EndLine`). Arquivos menores que 100 linhas podem ser inspecionados em bloco único.

2. **PROIBIDO Despejo Bruto de Terminal (> 30 linhas) - Padrão RTK:**
   - Despejos brutos de compiladores, test runners ou linters com mais de 30 linhas são proibidos na memória ativa.
   - Aplicação obrigatória do **Padrão RTK** (*Redução de Tokens de Kernel*): saídas devem ser filtradas estritamente para o sumário de 3 pontos:
     - `[Status]`: Sucesso, Falha ou Aviso.
     - `[Alvo]`: Projeto, Suíte ou Arquivo inspecionado.
     - `[Erros]`: Lista concisa contendo apenas `Arquivo:Linha:Código - Mensagem`.

3. **PROIBIDA Reescrita Integral de Arquivos:**
   - Para arquivos existentes, é proibido sobrescrever o conteúdo completo para alterações locais.
   - Toda alteração deve utilizar substituição de blocos atômicos (`replace_file_content`) ancorada em números de linha precisos.

4. **TETO RÍGIDO DE 300 LINHAS PARA MEMÓRIA ATIVA:**
   - Nenhum arquivo de documentação interna, memória ativa ou mapa de contexto pode exceder 300 linhas de texto. Documentos extensos devem ser obrigatoriamente particionados em submódulos funcionais.

5. **FILOSOFIA ZERO-FLUFF:**
   - Eliminação de preâmbulos conversacionais vazios, cortesias repetitivas e justificativas prévias desnecessárias antes de chamadas de ferramenta. Foco exclusivo em sinal técnico.

---

## 2. Protocolo de Leitura Cirúrgica (Surgical Windowing)

1. **Etapa 1 - Mapeamento Semântico Prévio:**
   - Executar busca rápida de símbolos (grep de assinaturas de métodos, classes ou interfaces) para obter o intervalo exato de linhas antes de ler o corpo da função.
2. **Etapa 2 - Fatiamento Cirúrgico:**
   - Invocar `view_file(AbsolutePath, StartLine, EndLine)` com `EndLine - StartLine <= 80`.
3. Veja o guia detalhado em [surgical_windowing_guide.md](./references/surgical_windowing_guide.md).

---

## 3. Padrão RTK (Redução de Tokens de Kernel)

Comandos de terminal devem incluir flags de contenção de ruído (ex: `--verbosity quiet`, `--silent`, filtros de primeira/última linha) e reportar no formato condensado:

```text
[STATUS]: SUCESSO
[ALVO]: RestauranteInteligente.UnitTests
[DIAGNÓSTICO]: 18 testes executados, 0 falhas, 0 warnings.
```

Veja a especificação em [rtk_terminal_sanitization.md](./references/rtk_terminal_sanitization.md).

---

## 4. Matriz de Avaliação de Eficiência de Tokens

| Prática Ineficiente (Alto Ruído) | Prática de Alta Densidade (Token-Density) | Economia Estimada |
| :--- | :--- | :--- |
| `view_file` completo em arquivo de 500 linhas | `view_file` cirúrgico de 40 linhas no método-alvo | ~92% de tokens poupados |
| Despejo de 200 linhas de log de build do .NET | Sumário RTK em 3 pontos com linha e erro | ~95% de tokens poupados |
| Reescrita total de arquivo de 400 linhas | `replace_file_content` em bloco de 10 linhas | ~97% de tokens de saída |
| Preâmbulos sociais longos antes de agir | Execução direta com foco técnico (Zero-Fluff) | ~80% no payload textual |

Consulte [efficiency_matrix.md](./references/efficiency_matrix.md) para a matriz completa.

---

## 5. Higiene de Contexto e Estratificação U-AMOS

- **Gatilho de Compactação (`/compact`):** Disparar compactação quando a janela de contexto se aproximar de 60% de saturação, prevenindo a perda de instruções (*Lost in the Middle*).
- **Limpeza de Sessão (`/clear`):** Acionar ao alternar entre domínios heterogêneos (ex: migrar do Backend C# para o Worker Python ou Frontend React Native).
- Consulte [context_hygiene_and_uamos.md](./references/context_hygiene_and_uamos.md) para detalhes da estratificação Hot/Warm/Cold.
