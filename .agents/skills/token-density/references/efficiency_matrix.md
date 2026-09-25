# Matriz de Avaliação de Eficiência de Tokens

Esta matriz compara abordagens convencionais (altamente ruidosas e propensas a alucinação) com as práticas obrigatórias de alta densidade da skill `token-density`.

| Dimensão Operacional | Prática Ineficiente (Alto Ruído) | Prática Canônica (Token-Density) | Impacto / Economia |
| :--- | :--- | :--- | :--- |
| **Leitura de Código** | Ler o arquivo inteiro de 600 linhas com `view_file` para editar 1 método. | Localizar a linha via AST/grep e ler fatia de 40 linhas com `StartLine`/`EndLine`. | **~93% menos tokens** na janela; elimina *Lost in the Middle*. |
| **Edição de Código** | Reescrever o arquivo de 400 linhas com `write_to_file` para alterar 5 linhas. | Usar `replace_file_content` com bloco de substituição atômico ancorado em linhas. | **~98% menos tokens de saída**; previne corrupção acidental do restante do arquivo. |
| **Execução de Build** | Despejar 150 linhas de saída bruta do compilador no contexto. | Compilar com `--verbosity quiet` e sumariar no padrão RTK de 3 pontos. | **~95% de ruído expurgado**; preserva o foco nos erros reais. |
| **Execução de Testes** | Imprimir logs de passagem de 80 testes unitários verdes. | Rodar com flag `-q` ou `--verbosity quiet` e reportar apenas métricas consolidadas. | **~90% menos tokens consumidos**. |
| **Comunicação / Chat** | Escrever preâmbulos longos ("Certamente! Vou agora analisar o arquivo..."). | Resposta direta e técnica (Zero-Fluff) focada na ação. | **~80% de concisão no diálogo**; maior velocidade de resposta. |
| **Documentação Interna** | Arquivos monolíticos de 1.000 linhas misturando todos os tópicos. | Módulos orientados a funcionalidade com teto estrito de 300 linhas por arquivo. | **Respeito ao orçamento de contexto**; carregamento sob demanda. |
| **Saturação de Contexto** | Continuar a sessão até 90% da janela com instruções ignoradas pelo modelo. | Acionar `/compact` ao atingir ~60% e `/clear` ao alternar grandes domínios de código. | **Erradicação do *instruction fade-out***. |
