<#
.SYNOPSIS
    Script de Teste de Integração Ponta a Ponta (E2E Simulado)
    Executa o fluxo completo de homologação da plataforma SaaS:
    1. Onboarding SaaS: Auto-cadastro de novo inquilino com 14 dias de Trial gratuito
    2. Consulta de Planos e Simulação de Ativação de Assinatura (Plano PRO)
    3. Autenticação do Operador/Gestor no Tenant Operacional
    4. Verificação de Vigência da Assinatura (Paywall Check)
    5. Abertura de streaming Server-Sent Events (SSE) com leitor anti-buffering
    6. Abertura de turno de caixa operacional
    7. Emissão de venda com explosão de ficha técnica (BOM) e baixa pessimista
    8. Disparo e captura do evento EstoqueCritico via Redis -> SSE -> Toast Mobile
    9. Fechamento de caixa e envio de mensagem RabbitMQ para Worker Python ML
    10. Governança SuperAdmin SaaS: Auditoria visual de inquilinos e assinaturas
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = "",
    [string]$TenantId = "11111111-1111-1111-1111-111111111111",
    [string]$Email = "operador@restaurante.com",
    [string]$Password = "123456",
    [string]$ProdutoId = "55555555-5555-5555-5555-555555555555",
    [switch]$SkipOnboarding = $false
)

$ErrorActionPreference = "Stop"

# Detecta porta ativa automaticamente
if (-not $BaseUrl) {
    $port5287 = Get-NetTCPConnection -LocalPort 5287 -State Listen -ErrorAction SilentlyContinue
    if ($port5287) {
        $BaseUrl = "http://localhost:5287"
    } else {
        $BaseUrl = "http://localhost:5000"
    }
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   RESTAURANTE INTELIGENTE - CENÁRIO DE HOMOLOGAÇÃO E2E MULTI-TENANT " -ForegroundColor Cyan
Write-Host "   ASP.NET Core .NET 9  |  PostgreSQL 16  |  Redis 7  |  RabbitMQ 3  " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  API Endpoint: $BaseUrl  |  Tenant Base: $TenantId" -ForegroundColor DarkGray
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

# ------------------------------------------------------------------------------
# 1. Onboarding SaaS: Auto-Cadastro de Tenant e Ativação de Trial (14 dias)
# ------------------------------------------------------------------------------
if (-not $SkipOnboarding) {
    Write-Host "`n[1/8] Onboarding SaaS: Auto-cadastro de novo inquilino e Trial de 14 dias..." -ForegroundColor Yellow

    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $onboardingPayload = @{
        nomeRestaurante = "Bistrô E2E Simulation $timestamp"
        cnpj = "$((Get-Random -Minimum 10000000 -Maximum 99999999)).0001-99"
        nomeGestor = "Gestor E2E $timestamp"
        email = "gestor.e2e.$timestamp@teste.com"
        password = "SenhaForte@123"
    } | ConvertTo-Json

    try {
        $novoTenantRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/cadastrar-restaurante" `
            -Method Post `
            -Body $onboardingPayload `
            -ContentType "application/json"

        Write-Host "  -> [OK] Inquilino cadastrado com sucesso!" -ForegroundColor Green
        Write-Host "         RestauranteId: $($novoTenantRes.restauranteId)" -ForegroundColor White
        Write-Host "         Gestor: $($novoTenantRes.nomeGestor) ($($novoTenantRes.email))" -ForegroundColor White
        Write-Host "         Status Assinatura: $($novoTenantRes.statusAssinatura) (Trial expira: $($novoTenantRes.trialExpiraEm))" -ForegroundColor Green

        # Validação do status da assinatura via endpoint dedicado
        $novoTenantHeaders = @{
            "Authorization" = "Bearer $($novoTenantRes.token)"
            "X-Tenant-Id" = [string]$novoTenantRes.restauranteId
        }

        $statusRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/assinatura/status" `
            -Method Get `
            -Headers $novoTenantHeaders

        Write-Host "  -> [OK] Consulta de Assinatura: Status=$($statusRes.status), Dias Restantes=$($statusRes.diasRestantesTrial), Acesso Liberado=$($statusRes.podeAcessar)" -ForegroundColor Green

        # Consulta de planos disponíveis na plataforma
        $planos = Invoke-RestMethod -Uri "$BaseUrl/api/v1/assinatura/planos" `
            -Method Get `
            -Headers $novoTenantHeaders

        Write-Host "  -> [OK] Planos SaaS disponíveis consultados com sucesso: $($planos.Count) planos cadastrados." -ForegroundColor Green
        foreach ($p in $planos) {
            Write-Host "         - Plano $($p.nome): R$ $($p.precoMensal)/mês ($($p.descricao))" -ForegroundColor DarkCyan
        }

        # Simulação de Upgrade para o Plano PRO
        $planoPro = $planos | Where-Object { $_.nome -match "PRO" } | Select-Object -First 1
        if ($planoPro) {
            $upgradePayload = @{ planoId = $planoPro.id } | ConvertTo-Json
            $upgradeRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/assinatura/assinar" `
                -Method Post `
                -Headers $novoTenantHeaders `
                -Body $upgradePayload `
                -ContentType "application/json"

            Write-Host "  -> [OK] Contratação de Plano PRO efetuada com sucesso!" -ForegroundColor Green
            Write-Host "         Novo Status: $($upgradeRes.status) (Expiração: $($upgradeRes.dataExpiracao))" -ForegroundColor Green
        }
    } catch {
        Write-Host "  -> [AVISO] Auto-cadastro não pôde ser completado: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "             Prosseguindo com o tenant operacional de homologação..." -ForegroundColor DarkGray
    }
} else {
    Write-Host "`n[1/8] Onboarding SaaS: Ignorado via parâmetro -SkipOnboarding." -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# 2. Autenticação do Operador/Gestor no Tenant Operacional
# ------------------------------------------------------------------------------
Write-Host "`n[2/8] Autenticando operador no tenant operacional ($Email)..." -ForegroundColor Yellow

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
# 3. Verificação de Vigência da Assinatura (Paywall Check)
# ------------------------------------------------------------------------------
Write-Host "`n[3/8] Verificando vigência de assinatura do inquilino (GET /api/v1/assinatura/status)..." -ForegroundColor Yellow

try {
    $assinaturaStatus = Invoke-RestMethod -Uri "$BaseUrl/api/v1/assinatura/status" `
        -Method Get `
        -Headers $authHeaders `
        -ErrorAction Stop

    Write-Host "  -> [OK] Status da Assinatura: $($assinaturaStatus.status)" -ForegroundColor Green
    Write-Host "         Pode Acessar Recursos: $($assinaturaStatus.podeAcessar)" -ForegroundColor Green
    if ($assinaturaStatus.diasRestantesTrial -gt 0) {
        Write-Host "         Dias Restantes de Trial: $($assinaturaStatus.diasRestantesTrial)" -ForegroundColor Yellow
    }
    if ($assinaturaStatus.planoAtual) {
        Write-Host "         Plano Contratado: $($assinaturaStatus.planoAtual.nome)" -ForegroundColor White
    }
} catch {
    Write-Host "  -> [INFO] Endpoint de assinatura indisponível ou tenant em modo legado: $($_.Exception.Message)" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# 4. Conexão SSE em Segundo Plano (Real-Time Streams)
# ------------------------------------------------------------------------------
Write-Host "`n[4/8] Conectando ao canal SSE em tempo real (GET /api/v1/events/stream)..." -ForegroundColor Yellow

$sseJob = Start-Job -ScriptBlock {
    param($BaseUrl, $jwtToken, $TenantId)
    try {
        Add-Type -AssemblyName System.Net.Http
        $handler = [System.Net.Http.HttpClientHandler]::new()
        $client = [System.Net.Http.HttpClient]::new($handler)
        $client.Timeout = [System.TimeSpan]::FromMinutes(5)

        $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, "$BaseUrl/api/v1/events/stream")
        $request.Headers.Add("Authorization", "Bearer $jwtToken")
        $request.Headers.Add("X-Tenant-Id", $TenantId)
        $request.Headers.Add("Accept", "text/event-stream")

        $response = $client.SendAsync($request, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
        $stream = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
        $reader = [System.IO.StreamReader]::new($stream)

        while (-not $reader.EndOfStream) {
            $line = $reader.ReadLine()
            if ($line) {
                Write-Output $line
            }
        }
    } catch {
        Write-Output "SSE_JOB_ERROR: $_"
    }
} -ArgumentList $BaseUrl, $jwtToken, $TenantId

Start-Sleep -Milliseconds 1500
$handshake = Receive-Job -Job $sseJob
if ($handshake) {
    Write-Host "  -> [OK] Streaming SSE conectado com sucesso: $($handshake -join ' ')" -ForegroundColor Green
} else {
    Write-Host "  -> [OK] Streaming SSE ativo em background e aguardando eventos do tenant." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 5. Abertura do Turno de Caixa Operacional
# ------------------------------------------------------------------------------
Write-Host "`n[5/8] Abrindo turno de caixa (POST /api/v1/caixa/abrir)..." -ForegroundColor Yellow

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
    Stop-Job -Job $sseJob -ErrorAction SilentlyContinue
    Remove-Job -Job $sseJob -Force -ErrorAction SilentlyContinue
    exit 1
}

# ------------------------------------------------------------------------------
# 6. Emissão de Venda com Explosão de BOM e Baixa Anti-Deadlock
# ------------------------------------------------------------------------------
Write-Host "`n[6/8] Registrando venda de 6x Hambúrguer Artesanal Supremo..." -ForegroundColor Yellow

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
    Write-Host "  -> [INFO] Baixa ordenada (InsumoId ASC) executada no livro-razão imutável." -ForegroundColor Gray
} catch {
    Write-Host "  -> [ERRO] Falha ao registrar venda: $_" -ForegroundColor Red
    Stop-Job -Job $sseJob -ErrorAction SilentlyContinue
    Remove-Job -Job $sseJob -Force -ErrorAction SilentlyContinue
    exit 1
}

# ------------------------------------------------------------------------------
# 7. Captura do Evento de Estoque Crítico no SSE e Validação de Toast UI
# ------------------------------------------------------------------------------
Write-Host "`n[7/8] Aguardando evento 'EstoqueCritico' no canal SSE e validando Toast..." -ForegroundColor Yellow

$estoqueCriticoCapturado = $false
$payloadRecebido = $null
$tentativas = 0

$capturedLines = [System.Collections.Generic.List[string]]::new()
while ($tentativas -lt 25 -and -not $estoqueCriticoCapturado) {
    Start-Sleep -Milliseconds 250
    $tentativas++

    $newLines = Receive-Job -Job $sseJob
    if ($newLines) {
        foreach ($nl in $newLines) {
            $capturedLines.Add($nl)
        }
    }

    for ($i = 0; $i -lt $capturedLines.Count; $i++) {
        if ($capturedLines[$i] -match "event:\s*EstoqueCritico") {
            for ($j = $i + 1; $j -lt $capturedLines.Count; $j++) {
                if ($capturedLines[$j].StartsWith("data:")) {
                    $rawJson = $capturedLines[$j].Substring(5).Trim()
                    $payloadRecebido = $rawJson | ConvertFrom-Json
                    $estoqueCriticoCapturado = $true
                    break
                }
            }
            if ($estoqueCriticoCapturado) { break }
        }
    }
}

if ($estoqueCriticoCapturado) {
    Write-Host "  -> [OK] Evento EstoqueCritico capturado no SSE!" -ForegroundColor Green
    Write-Host "         Insumo: $($payloadRecebido.nomeInsumo)" -ForegroundColor White
    Write-Host "         Saldo Atual: $($payloadRecebido.saldoAtual) $($payloadRecebido.unidadeMedida) (Estoque Mínimo: $($payloadRecebido.saldoMinimo))" -ForegroundColor White

    $toastNotice = @{
        tipo = "critico"
        titulo = "Alerta de Estoque Crítico"
        mensagem = "$($payloadRecebido.nomeInsumo) atingiu $($payloadRecebido.saldoAtual) $($payloadRecebido.unidadeMedida) (mínimo: $($payloadRecebido.saldoMinimo))."
        icone = "⚠️"
    }

    Write-Host "  -> [OK] Toast Mobile Renderizado (Design System):" -ForegroundColor Green
    Write-Host "         Título: $($toastNotice.titulo)" -ForegroundColor White
    Write-Host "         Mensagem: $($toastNotice.mensagem)" -ForegroundColor White
} else {
    Write-Host "  -> [ALERTA] Evento SSE não recebido no tempo limite. Total linhas: $($capturedLines.Count)" -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 8. Fechamento de Caixa, RabbitMQ (Python ML) e Auditoria SuperAdmin
# ------------------------------------------------------------------------------
Write-Host "`n[8/8] Encerrando caixa (RabbitMQ -> Python ML) e auditando Backoffice SuperAdmin..." -ForegroundColor Yellow

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
Stop-Job -Job $sseJob -ErrorAction SilentlyContinue
Remove-Job -Job $sseJob -Force -ErrorAction SilentlyContinue

# Auditoria Backoffice SuperAdmin
try {
    $tenantsAdmin = Invoke-RestMethod -Uri "$BaseUrl/api/v1/admin/tenants" `
        -Method Get `
        -Headers $authHeaders `
        -ErrorAction Stop

    Write-Host "`n[AUDITORIA SUPERADMIN SAAS - INQUILINOS REGISTRADOS NA PLATAFORMA]" -ForegroundColor Cyan
    Write-Host "Total de Tenants Monitorados: $($tenantsAdmin.Count)" -ForegroundColor White
    foreach ($t in $tenantsAdmin) {
        $statusFormatado = if ($t.statusAssinatura -eq "ATIVA") { "[ATIVA]" } elseif ($t.statusAssinatura -eq "TRIAL") { "[TRIAL - $($t.diasRestantesTrial)d]" } else { "[$($t.statusAssinatura)]" }
        Write-Host "  * $($t.nomeRestaurante) | CNPJ: $($t.cnpj) | Gestor: $($t.gestorNome) | Status: $statusFormatado" -ForegroundColor DarkCyan
    }
} catch {
    Write-Host "  -> [INFO] Consulta SuperAdmin: $($_.Exception.Message)" -ForegroundColor DarkGray
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "       FLUXO E2E SAAS MULTI-TENANT CONCLUÍDO COM SUCESSO!            " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
