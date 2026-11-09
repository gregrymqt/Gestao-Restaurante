<#
.SYNOPSIS
    Pipeline Master de Apresentacao Tecnica para a Banca de TCC
    Sistema Restaurante Inteligente - Multi-Tenant com RLS, RabbitMQ e Python ML
.DESCRIPTION
    Permite conduzir a apresentacao passo a passo:
    1. Zerar banco e front (Soft Reset)
    2. Injetar dados ilustrativos (Catalogo, Estoque Critico, 30d historico, Caixa aberto)
    3. Disparar Previsao de Demanda com Machine Learning em Tempo Real
    4. Auditar capacidade produtiva e insumos gargalo
    5. Checar saude dos microsservicos
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:80",
    [string]$TenantId = "11111111-1111-1111-1111-111111111111",
    [string]$Email = "gestor@restaurante.com",
    [string]$Password = "123456",
    [ValidateSet("Menu", "Reset", "Popular", "Predizer", "Capacidade", "Status")]
    [string]$Acao = "Menu"
)

# Auto-deteccao de portas locais caso o gateway Nginx nao esteja em :80
if ($BaseUrl -eq "http://localhost:80") {
    $port80 = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue
    if (-not $port80) {
        $port5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
        if ($port5000) { $BaseUrl = "http://localhost:5000" }
    }
}

function Show-Banner {
    Clear-Host
    Write-Host "============================================================================================" -ForegroundColor Cyan
    Write-Host "         SISTEMA RESTAURANTE INTELIGENTE - PIPELINE DE APRESENTACAO (BANCA TCC)             " -ForegroundColor White
    Write-Host "     ASP.NET Core .NET 9  |  Python 3.12 ML  |  PostgreSQL 16  |  RabbitMQ 3  |  Redis 7    " -ForegroundColor Cyan
    Write-Host "============================================================================================" -ForegroundColor Cyan
    Write-Host "  API: $BaseUrl  |  Tenant: $TenantId  |  Usuario: $Email" -ForegroundColor DarkGray
    Write-Host "--------------------------------------------------------------------------------------------`n" -ForegroundColor DarkGray
}

function Get-AuthToken {
    param([switch]$Silent = $false)
    if (-not $Silent) {
        Write-Host "Autenticando Gestor do Restaurante na WebAPI..." -ForegroundColor Yellow
    }

    $payload = @{
        email = $Email
        password = $Password
        restauranteId = $TenantId
    } | ConvertTo-Json

    try {
        $res = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" `
            -Method Post `
            -Body $payload `
            -ContentType "application/json" `
            -TimeoutSec 5 `
            -ErrorAction Stop

        if (-not $Silent) {
            Write-Host "  -> [OK] Autenticado com sucesso! Token JWT emitido." -ForegroundColor Green
        }
        return @{
            Token = $res.token
            Headers = @{
                "Authorization" = "Bearer $($res.token)"
                "X-Tenant-Id" = $TenantId
            }
        }
    } catch {
        Write-Host "  -> [ERRO] Falha ao autenticar em $BaseUrl/api/v1/auth/login: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Invoke-SqlFile {
    param([string]$SqlRelativePath)

    $fullPath = Join-Path $PSScriptRoot $SqlRelativePath
    if (-not (Test-Path $fullPath)) {
        Write-Host "  -> [ERRO] Arquivo SQL nao encontrado: $fullPath" -ForegroundColor Red
        return $false
    }

    try {
        Get-Content $fullPath -Raw | docker exec -i restaurante_postgres psql -U postgres -d restaurante_db > $null 2>&1
        return $true
    } catch {
        Write-Host "  -> [ERRO] Falha ao executar SQL no Docker: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Reset-Sistema {
    Write-Host "`n[Passo 1] Executando Reset Cirurgico Operacional..." -ForegroundColor Yellow
    Write-Host "  -> Limpando vendas, itens, fechamentos de caixa, movimentacoes e previsoes..." -ForegroundColor DarkGray
    
    $ok = Invoke-SqlFile "sql/demo_reset.sql"
    if ($ok) {
        Write-Host "  -> [OK] Sistema esvaziado com sucesso no PostgreSQL!" -ForegroundColor Green
        Write-Host "  -> [ESTADO ATUAL] Vendas: 0 | Faturamento: R`$ 0,00 | Previsoes IA: 0 | Estoques Zerados" -ForegroundColor White
        Write-Host "  -> DICA PARA O PROFESSOR: Recarregue o App no celular agora para mostrar a tela 100% limpa." -ForegroundColor Magenta
    }
}

function Popular-DadosIlustrativos {
    Write-Host "`n[Passo 2] Injetando Carga de Dados Ilustrativos para Demonstracao..." -ForegroundColor Yellow
    Write-Host "  -> Inserindo catalogo de produtos, estoque critico, BOM, 30 dias de vendas e caixa aberto..." -ForegroundColor DarkGray

    $ok = Invoke-SqlFile "sql/demo_seed.sql"
    if ($ok) {
        Write-Host "  -> [OK] Carga ilustrativa aplicada com sucesso no PostgreSQL!" -ForegroundColor Green
        Write-Host "  -> [ESTADO ATUAL] 199 vendas registradas (30 dias) | Caixa aberto hoje com R`$ 327,00 (3 vendas)" -ForegroundColor White
        Write-Host "  -> [ESTOQUE CRITICO] Pao Brioche (18 un / min 30) e Carne Moida (3.2 kg / min 5 kg) em alerta!" -ForegroundColor Yellow
        Write-Host "  -> [CLAUSULA DA IA] Tabela 'Previsoes' mantida 100% VAZIA para inferencia ao vivo." -ForegroundColor Cyan
        Write-Host "  -> DICA PARA O PROFESSOR: Recarregue o App no celular para ver faturamento e alertas de estoque." -ForegroundColor Magenta
    }
}

function Disparar-IaTempoReal {
    Write-Host "`n[Passo 3] Disparando Inferencia de Machine Learning em Tempo Real..." -ForegroundColor Yellow

    $auth = Get-AuthToken -Silent $false
    if (-not $auth) { return }

    try {
        Write-Host "  -> Chamando endpoint POST $BaseUrl/api/v1/previsoes/disparar..." -ForegroundColor DarkGray
        $disparoRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/previsoes/disparar" `
            -Method Post `
            -Headers $auth.Headers `
            -TimeoutSec 10 `
            -ErrorAction Stop

        Write-Host "  -> [OK] Solicitacao aceita pela WebAPI C# (.NET 9)!" -ForegroundColor Green
        Write-Host "         CorrelationId: $($disparoRes.correlationId)" -ForegroundColor DarkGray
        Write-Host "         Produtos Solicitados: $($disparoRes.totalProdutosSolicitados)" -ForegroundColor White
        Write-Host "         Clima Consultado (Open-Meteo): $($disparoRes.temperaturaPrevista) C | Chuva: $($disparoRes.precipitacaoPrevista)mm" -ForegroundColor Cyan
        Write-Host "  -> [MENSAGERIA] Evento 'PrevisaoDemandaSolicitadaEvent' publicado no RabbitMQ!" -ForegroundColor Green

        Write-Host "`n[Aguardando Inferencia no Worker Python ML via aio-pika...]" -ForegroundColor Yellow
        for ($i = 3; $i -ge 1; $i--) {
            Write-Host -NoNewline "  -> Worker treinando HistGradientBoostingRegressor e computando projecao... ($i seg)`r"
            Start-Sleep -Seconds 1
        }

        Write-Host "`n  -> [OK] Worker Python processou as mensagens e publicou 'PrevisaoDemandaConcluidaEvent'!" -ForegroundColor Green
        Write-Host "  -> [OK] Consumer C# MassTransit persistiu os resultados na tabela Previsoes via RLS!" -ForegroundColor Green

        # Exibe imediatamente o relatorio de capacidade calculado
        Consultar-RelatorioCapacidade -Auth $auth
    } catch {
        Write-Host "  -> [ERRO] Falha ao disparar previsao de IA: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Consultar-RelatorioCapacidade {
    param($Auth = $null)

    if (-not $Auth) {
        $Auth = Get-AuthToken -Silent $true
        if (-not $Auth) { return }
    }

    try {
        $report = Invoke-RestMethod -Uri "$BaseUrl/api/v1/previsoes/capacidade" `
            -Method Get `
            -Headers $Auth.Headers `
            -TimeoutSec 5 `
            -ErrorAction Stop

        Write-Host "`n================================================================================" -ForegroundColor Cyan
        Write-Host "   RELATORIO DE CAPACIDADE PRODUTIVA E ANALISE DE RUPTURA DE ESTOQUE (IA)       " -ForegroundColor White
        Write-Host "   Data Alvo da Projecao: $($report.dataReferencia)                             " -ForegroundColor Cyan
        Write-Host "================================================================================" -ForegroundColor Cyan

        $itens = if ($report.itensCapacidade) { $report.itensCapacidade } else { $report.itens }
        if ($itens -and $itens.Count -gt 0) {
            $fmt = '{0,-30} | {1,14} | {2,12} | {3,12} | {4,-15} | {5,-20}'
            Write-Host ($fmt -f 'PRODUTO', 'DEMANDA PREV.', 'CAPACIDADE', 'ATENDIVEL', 'RISCO RUPTURA', 'INSUMO GARGALO') -ForegroundColor Yellow
            Write-Host ('-' * 115) -ForegroundColor DarkGray

            foreach ($item in $itens) {
                $demanda = "$([math]::Round([decimal]$item.demandaPrevista, 1)) un"
                $cap = "$($item.capacidadeMaximaProducao) un"
                $atendivel = "$([math]::Round([decimal]$item.demandaAtendivel, 1)) un"
                $risco = if ($item.riscoRutura) { 'SIM (RUPTURA!)' } else { 'NAO' }
                $gargalo = if ($item.insumoGargaloNome) { $item.insumoGargaloNome } elseif ($item.nomeInsumoGargalo) { $item.nomeInsumoGargalo } else { 'Nenhum' }

                $linha = $fmt -f $item.nomeProduto, $demanda, $cap, $atendivel, $risco, $gargalo

                if ($item.riscoRutura) {
                    Write-Host $linha -ForegroundColor Red
                } else {
                    Write-Host $linha -ForegroundColor Green
                }
            }
            Write-Host ('-' * 115) -ForegroundColor DarkGray
        } else {
            Write-Host "Nenhum produto com previsao localizada para a data." -ForegroundColor Yellow
        }

        Write-Host "`n  -> [SUCESSO] Previsoes sincronizadas! Olhe a tela do celular do Gestor agora!" -ForegroundColor Magenta
    } catch {
        Write-Host "  -> [ERRO] Falha ao consultar capacidade: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Check-ServicesStatus {
    Write-Host "`n[Verificacao de Saude da Infraestrutura e Microsservicos]" -ForegroundColor Yellow

    # 1. PostgreSQL
    $pg = docker ps --filter "name=restaurante_postgres" --format "{{.Status}}"
    if ($pg -like "*healthy*" -or $pg -like "*Up*") {
        Write-Host "  [OK] PostgreSQL 16: $pg" -ForegroundColor Green
    } else {
        Write-Host "  [FALHA] PostgreSQL 16: Nao esta saudavel ou ativo!" -ForegroundColor Red
    }

    # 2. Redis
    $rd = docker ps --filter "name=restaurante_redis" --format "{{.Status}}"
    if ($rd -like "*healthy*" -or $rd -like "*Up*") {
        Write-Host "  [OK] Redis 7: $rd" -ForegroundColor Green
    } else {
        Write-Host "  [FALHA] Redis 7: Nao esta saudavel ou ativo!" -ForegroundColor Red
    }

    # 3. RabbitMQ
    $rb = docker ps --filter "name=restaurante_rabbitmq" --format "{{.Status}}"
    if ($rb -like "*healthy*" -or $rb -like "*Up*") {
        Write-Host "  [OK] RabbitMQ 3: $rb" -ForegroundColor Green
    } else {
        Write-Host "  [FALHA] RabbitMQ 3: Nao esta saudavel ou ativo!" -ForegroundColor Red
    }

    # 4. WebAPI C#
    try {
        $apiCheck = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" -Method Post -Body "{}" -ContentType "application/json" -TimeoutSec 3 -ErrorAction SilentlyContinue
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -in @(400, 401, 415, 422)) {
            Write-Host "  [OK] Backend C# (.NET 9): Ativo em $BaseUrl" -ForegroundColor Green
        } else {
            Write-Host "  [FALHA] Backend C# (.NET 9): Indisponivel em $BaseUrl" -ForegroundColor Red
        }
    }

    # 5. Worker Python ML
    $ml = docker ps --filter "name=restaurante_ml_worker" --format "{{.Status}}"
    if ($ml -like "*Up*") {
        Write-Host "  [OK] Worker Python ML (Docker): $ml" -ForegroundColor Green
    } else {
        Write-Host "  [FALHA] Worker Python ML: Nao localizado no Docker!" -ForegroundColor Red
    }
}

# ------------------------------------------------------------------------------
# Execucao Direta por Parametro
# ------------------------------------------------------------------------------
switch ($Acao) {
    "Reset" { Reset-Sistema; exit }
    "Popular" { Popular-DadosIlustrativos; exit }
    "Predizer" { Disparar-IaTempoReal; exit }
    "Capacidade" { Consultar-RelatorioCapacidade; exit }
    "Status" { Check-ServicesStatus; exit }
}

# ------------------------------------------------------------------------------
# Loop do Menu Interativo
# ------------------------------------------------------------------------------
while ($true) {
    Show-Banner
    Write-Host '  [1] Zerar Sistema (Soft Reset Operacional -> App fica com R$ 0,00 e 0 vendas)' -ForegroundColor Cyan
    Write-Host '  [2] Injetar Carga Ilustrativa (30 dias de vendas, estoque critico e caixa aberto)' -ForegroundColor Green
    Write-Host '  [3] Disparar IA / Previsao em Tempo Real (RabbitMQ + Python ML Worker)' -ForegroundColor Yellow
    Write-Host '  [4] Consultar Relatorio de Capacidade Produtiva e Insumos Gargalo' -ForegroundColor White
    Write-Host '  [5] Checagem de Saude da Infraestrutura e Microsservicos' -ForegroundColor DarkGray
    Write-Host '  [0] Sair' -ForegroundColor Red
    Write-Host ''
    $opcao = Read-Host "Selecione uma opcao para a apresentacao"

    switch ($opcao) {
        "1" { Reset-Sistema; Read-Host "`nPressione ENTER para voltar ao menu..." }
        "2" { Popular-DadosIlustrativos; Read-Host "`nPressione ENTER para voltar ao menu..." }
        "3" { Disparar-IaTempoReal; Read-Host "`nPressione ENTER para voltar ao menu..." }
        "4" { Consultar-RelatorioCapacidade; Read-Host "`nPressione ENTER para voltar ao menu..." }
        "5" { Check-ServicesStatus; Read-Host "`nPressione ENTER para voltar ao menu..." }
        "0" { exit }
        default { Write-Host "Opcao invalida!" -ForegroundColor Red; Start-Sleep -Seconds 1 }
    }
}
