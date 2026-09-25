# Padrão RTK: Redução de Tokens de Kernel em Terminal

## Definição e Princípio

O **Padrão RTK** (*Redução de Tokens de Kernel*) estipula que saídas de compiladores, analisadores estáticos, instaladores de pacotes e suítes de teste nunca devem ser despejadas em formato bruto na memória ativa do agente se excederem 30 linhas.

O excesso de linhas brutas satura a janela de contexto com texto redundante (avisos de compilação sem erro, stack traces infinitos de testes bem-sucedidos), degradando o raciocínio subsequente.

---

## 1. Comandos com Flags de Baixo Ruído

### .NET (C#)
```powershell
# Compilação limpa sem logos nem avisos irrelevantes
dotnet build src/RestauranteInteligente.Api --verbosity quiet --nologo

# Execução de testes retornando apenas sumário
dotnet test tests/RestauranteInteligente.UnitTests --verbosity quiet --nologo
```

### Python
```powershell
# Execução silenciosa de testes com traceback conciso em caso de falha
pytest tests/unit -q --tb=short

# Inspeção estática concisa
ruff check app/ --quiet
```

### Node / Expo (React Native)
```powershell
# Execução silenciosa de verificação
npx tsc --noEmit --pretty false
```

### Git
```powershell
# Histórico condensado
git log -n 5 --oneline
```

---

## 2. Formato Canônico de Sumário RTK (3 Pontos)

Toda saída de comando extenso deve ser processada e sintetizada no seguinte formato estruturado de 3 pontos:

```text
[STATUS]: SUCESSO | FALHA | ALERTA
[ALVO]: <Nome do Projeto, Pacote ou Suíte Testada>
[DIAGNÓSTICO]: 
- <Linha / Arquivo / Código>: <Mensagem de erro exata>
- <Métricas resumidas: total de testes, falhas, tempo de execução>
```

### Exemplo de Sumário de Falha
```text
[STATUS]: FALHA
[ALVO]: RestauranteInteligente.UnitTests
[DIAGNÓSTICO]:
- InsumoTests.cs:42:CS0117: 'Insumo' não contém uma definição para 'PrecoCusto'.
- Total: 15 testes executados, 1 falha, 0 ignorados.
```
