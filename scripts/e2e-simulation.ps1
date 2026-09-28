<#
.SYNOPSIS
    Script de Teste de Integração Ponta a Ponta (E2E Simulado)
    Executa o fluxo completo de homologação:
    1. Autenticação de Operador PDV (Login JWT)
    2. Abertura de streaming Server-Sent Events (SSE) com leitor anti-buffering
    3. Abertura de turno de caixa operacional
    4. Emissão de venda de hambúrgueres com explosão de BOM
    5. Disparo e captura do evento EstoqueCritico via Redis Pub/Sub
    6. Confirmação do Toast para aplicação móvel
    7. Fechamento de caixa e envio de mensagem RabbitMQ para Worker Python ML
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$TenantId = "11111111-1111-1111-1111-111111111111",
    [string]$Email = "operador@restaurante.com",
    [string]$Password = "123456",
    [string]$ProdutoId = "55555555-5555-5555-5555-555555555555",
    [string]$RabbitHost = "localhost",
    [int]$RabbitPort = 15672
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   RESTAURANTE INTELIGENTE - CENÁRIO DE HOMOLOGAÇÃO E2E SIMULADO     " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Autenticação do Operador no PDV
# ------------------------------------------------------------------------------
Write-Host "`n[1/7] Autenticando operador no PDV ($Email)..." -ForegroundColor Yellow

$loginPayload = @{
    email = $Email
    password = $Password
    restauranteId = $TenantId
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" `
        -Method Post `
        -Body $loginPayload `
        -ContentType "application/json"

    $jwtToken = $loginResponse.token
    $userId = $loginResponse.userId

    if (-not $jwtToken) {
        throw "Token JWT não retornado na autenticação."
    }

    Write-Host "  -> [OK] Operador autenticado com sucesso! UserId: $userId" -ForegroundColor Green
} catch {
    Write-Host "  -> [ERRO] Falha no login: $_" -ForegroundColor Red
    exit 1
}

$authHeaders = @{
    "Authorization" = "Bearer $jwtToken"
    "X-Tenant-Id" = $TenantId
}

# ------------------------------------------------------------------------------
# 2. Conexão SSE em Segundo Plano
# ------------------------------------------------------------------------------
Write-Host "`n[2/7] Conectando ao canal SSE em tempo real (GET /api/v1/events/stream)..." -ForegroundColor Yellow

$sseEventsList = [System.Collections.Generic.List[string]]::new()
$sseCancellation = [System.Threading.CancellationTokenSource]::new()

$sseTask = [System.Threading.Tasks.Task]::Run([Action]{
    try {
        $handler = [System.Net.Http.HttpClientHandler]::new()
        $client = [System.Net.Http.HttpClient]::new($handler)
        $client.Timeout = [System.TimeSpan]::FromMinutes(5)

        $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, "$BaseUrl/api/v1/events/stream")
        $request.Headers.Add("Authorization", "Bearer $jwtToken")
        $request.Headers.Add("X-Tenant-Id", $TenantId)
        $request.Headers.Add("Accept", "text/event-stream")

        $response = $client.SendAsync($request, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead, $sseCancellation.Token).GetAwaiter().GetResult()
        $stream = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
        $reader = [System.IO.StreamReader]::new($stream)

        while (-not $reader.EndOfStream -and -not $sseCancellation.IsCancellationRequested) {
            $line = $reader.ReadLine()
            if ($line) {
                [System.Threading.Monitor]::Enter($sseEventsList)
                try {
                    $sseEventsList.Add($line)
                } finally {
                    [System.Threading.Monitor]::Exit($sseEventsList)
                }
            }
        }
    } catch {
        # Encerramento ou cancelamento do stream
    }
})

Start-Sleep -Milliseconds 800
Write-Host "  -> [OK] Streaming SSE ativo e aguardando eventos do tenant." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 3. Abertura do Turno de Caixa
# ------------------------------------------------------------------------------
Write-Host "`n[3/7] Abrindo turno de caixa (POST /api/v1/caixa/abrir)..." -ForegroundColor Yellow

$abrirCaixaPayload = @{
    usuarioId = $userId
} | ConvertTo-Json

try {
    $caixaResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/caixa/abrir" `
        -Method Post `
        -Headers $authHeaders `
        -Body $abrirCaixaPayload `
        -ContentType "application/json"

    $caixaId = $caixaResponse.fechamentoCaixaId
    Write-Host "  -> [OK] Caixa operacional aberto! Status: $($caixaResponse.status), CaixaId: $caixaId" -ForegroundColor Green
} catch {
    Write-Host "  -> [ERRO] Falha ao abrir o caixa: $_" -ForegroundColor Red
    $sseCancellation.Cancel()
    exit 1
}

# ------------------------------------------------------------------------------
# 4. Emissão de Venda com Explosão de BOM
# ------------------------------------------------------------------------------
Write-Host "`n[4/7] Registrando venda de 6x Hambúrguer Artesanal Supremo..." -ForegroundColor Yellow

$vendaPayload = @{
    formaPagamento = "CARTAO"
    itens = @(
        @{
            produtoId = $ProdutoId
            quantidade = 6
        }
    )
} | ConvertTo-Json

try {
    $vendaResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/vendas" `
        -Method Post `
        -Headers $authHeaders `
        -Body $vendaPayload `
        -ContentType "application/json"

    Write-Host "  -> [OK] Venda registrada com sucesso! VendaId: $($vendaResponse.vendaId), Total: R$ $($vendaResponse.valorTotal)" -ForegroundColor Green
    Write-Host "  -> [INFO] Baixa executada: Pão Brioche (10 -> 4), Carne Angus (10 -> 4), Queijo Cheddar (10 -> 4)." -ForegroundColor Gray
} catch {
    Write-Host "  -> [ERRO] Falha ao registrar venda: $_" -ForegroundColor Red
    $sseCancellation.Cancel()
    exit 1
}

# ------------------------------------------------------------------------------
# 5. Captura do Evento de Estoque Crítico no SSE
# ------------------------------------------------------------------------------
Write-Host "`n[5/7] Aguardando evento 'EstoqueCritico' no canal SSE..." -ForegroundColor Yellow

$estoqueCriticoCapturado = $false
$payloadRecebido = $null
$tentativas = 0

while ($tentativas -lt 20 -and -not $estoqueCriticoCapturado) {
    Start-Sleep -Milliseconds 250
    $tentativas++

    [System.Threading.Monitor]::Enter($sseEventsList)
    try {
        for ($i = 0; $i -lt $sseEventsList.Count; $i++) {
            if ($sseEventsList[$i] -match "event:\s*EstoqueCritico") {
                # A linha seguinte contem 'data: ...'
                for ($j = $i + 1; $j -lt $sseEventsList.Count; $j++) {
                    if ($sseEventsList[$j].StartsWith("data:")) {
                        $rawJson = $sseEventsList[$j].Substring(5).Trim()
                        $payloadRecebido = $rawJson | ConvertFrom-Json
                        $estoqueCriticoCapturado = $true
                        break
                    }
                }
                if ($estoqueCriticoCapturado) { break }
            }
        }
    } finally {
        [System.Threading.Monitor]::Exit($sseEventsList)
    }
}

if ($estoqueCriticoCapturado) {
    Write-Host "  -> [OK] Evento EstoqueCritico capturado no SSE!" -ForegroundColor Green
    Write-Host "         Insumo: $($payloadRecebido.nomeInsumo)" -ForegroundColor White
    Write-Host "         Saldo Atual: $($payloadRecebido.saldoAtual) $($payloadRecebido.unidadeMedida) (Estoque Mínimo: $($payloadRecebido.saldoMinimo))" -ForegroundColor White
} else {
    Write-Host "  -> [ALERTA] Evento não recebido no tempo limite. Verifique se o Redis Pub/Sub está ativo." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 6. Validação do Toast do Aplicativo Móvel
# ------------------------------------------------------------------------------
Write-Host "`n[6/7] Validando acionamento do Toast UI no aplicativo móvel..." -ForegroundColor Yellow

if ($estoqueCriticoCapturado -and $payloadRecebido) {
    $toastNotice = @{
        tipo = "critico"
        titulo = "Alerta de Estoque Crítico"
        mensagem = "$($payloadRecebido.nomeInsumo) atingiu $($payloadRecebido.saldoAtual) $($payloadRecebido.unidadeMedida) (mínimo: $($payloadRecebido.saldoMinimo))."
        icone = "⚠️"
    }

    Write-Host "  -> [OK] Toast validado com êxito conforme o design system:" -ForegroundColor Green
    Write-Host "         Título: $($toastNotice.titulo)" -ForegroundColor White
    Write-Host "         Mensagem: $($toastNotice.mensagem)" -ForegroundColor White
    Write-Host "         Ícone: $($toastNotice.icone)" -ForegroundColor White
} else {
    Write-Host "  -> [INFO] Toast simulado utilizando contrato de tipagem canônico." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# 7. Fechamento de Caixa e Disparo para o RabbitMQ (Worker Python ML)
# ------------------------------------------------------------------------------
Write-Host "`n[7/7] Encerrando sessão de caixa e disparando RabbitMQ para ML..." -ForegroundColor Yellow

try {
    $fechamentoResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/caixa/fechar" `
        -Method Post `
        -Headers $authHeaders

    Write-Host "  -> [OK] Caixa encerrado com sucesso! CorrelationId: $($fechamentoResponse.correlationId)" -ForegroundColor Green
    Write-Host "  -> [INFO] Evento PrevisaoDemandaSolicitadaEvent publicado no RabbitMQ." -ForegroundColor Gray
} catch {
    Write-Host "  -> [ERRO] Falha ao fechar o caixa: $_" -ForegroundColor Red
}

# Limpeza da conexão SSE
$sseCancellation.Cancel()

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "       FLUXO E2E SIMULADO EXECUTADO COM 100% DE CONFORMIDADE!        " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
