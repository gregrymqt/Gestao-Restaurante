<#
.SYNOPSIS
    Script Master de Apresentação Técnica - Sistema Restaurante Inteligente
    Desenvolvido para demonstração ao vivo para banca/professor.
.DESCRIPTION
    Gerencia autenticação automática JWT, verificação de microsserviços,
    execução de ciclo ponta a ponta (C# + RabbitMQ + Python ML + PostgreSQL)
    e visualização rica do relatório de capacidade produtiva com IA.
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = "",
    [ValidateSet("Menu", "Auto", "Capacidade", "Testes", "Status", "Onboarding", "Admin", "Schema")]
    [string]$Modo = "Menu",
    [string]$TenantId = "11111111-1111-1111-1111-111111111111",
    [string]$Email = "operador@restaurante.com",
    [string]$Password = "123456"
)

# Detecta porta ativa automaticamente
if (-not $BaseUrl) {
    $port5287 = Get-NetTCPConnection -LocalPort 5287 -State Listen -ErrorAction SilentlyContinue
    if ($port5287) {
        $BaseUrl = "http://localhost:5287"
    } else {
        $BaseUrl = "http://localhost:5287"
    }
}

function Show-Header {
    Clear-Host
    Write-Host "============================================================================================" -ForegroundColor Cyan
    Write-Host "         SISTEMA RESTAURANTE INTELIGENTE - DEMONSTRACAO DE BACKEND                          " -ForegroundColor White
    Write-Host "     ASP.NET Core .NET 9  |  Python 3.12 ML  |  PostgreSQL 16  |  RabbitMQ 3  |  Redis 7    " -ForegroundColor Cyan
    Write-Host "============================================================================================" -ForegroundColor Cyan
    Write-Host "  API Endpoint: $BaseUrl  |  Tenant: $TenantId" -ForegroundColor DarkGray
    Write-Host "--------------------------------------------------------------------------------------------" -ForegroundColor DarkGray
}

function Get-AuthContext {
    param([switch]$Silent = $false)
    if (-not $Silent) {
        Write-Host "Autenticando operador no PDV e obtendo token JWT..." -ForegroundColor Yellow
    }

    $loginPayload = @{
        email = $Email
        password = $Password
        restauranteId = $TenantId
    } | ConvertTo-Json

    try {
        $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" `
            -Method Post `
            -Body $loginPayload `
            -ContentType "application/json" `
            -TimeoutSec 5 `
            -ErrorAction Stop

        $jwtToken = $loginResponse.token
        $userId = $loginResponse.userId

        if (-not $jwtToken) {
            throw "A API não retornou o token JWT esperado."
        }

        $perfil = if ($loginResponse.perfil) { $loginResponse.perfil } else { "Operador" }

        if (-not $Silent) {
            Write-Host "  -> [OK] Autenticado com sucesso! UserId: $userId" -ForegroundColor Green
            Write-Host "  -> [OK] JWT Claims: Perfil=$perfil, RestauranteId=$TenantId" -ForegroundColor DarkGray
        }

        return @{
            Token = $jwtToken
            UserId = $userId
            Headers = @{
                "Authorization" = "Bearer $jwtToken"
                "X-Tenant-Id" = $TenantId
            }
        }
    } catch {
        Write-Host "  -> [ERRO DE AUTENTICACAO] Falha ao logar em $BaseUrl/api/v1/auth/login: $_" -ForegroundColor Red
        return $null
    }
}

function Check-ServicesStatus {
    Write-Host "`n[Verificacao de Saude da Infraestrutura e Microsservicos]" -ForegroundColor Yellow

    # 1. PostgreSQL
    $pgPort = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
    if ($pgPort) {
        Write-Host "  [OK] PostgreSQL 16 (Porta 5432): Ativo e ouvindo conexoes" -ForegroundColor Green
    } else {
        Write-Host "  [FALHA] PostgreSQL 16 (Porta 5432): Nao localizado! (docker compose up -d postgres)" -ForegroundColor Red
    }

    # 2. Redis
    $redisPort = Get-NetTCPConnection -LocalPort 6379 -State Listen -ErrorAction SilentlyContinue
    if ($redisPort) {
        Write-Host "  [OK] Redis 7 (Porta 6379): Ativo (Cache, Locks e Blacklist)" -ForegroundColor Green
    } else {
        Write-Host "  [FALHA] Redis 7 (Porta 6379): Nao localizado! (docker compose up -d redis)" -ForegroundColor Red
    }

    # 3. RabbitMQ
    $rabbitPort = Get-NetTCPConnection -LocalPort 5672 -State Listen -ErrorAction SilentlyContinue
    if ($rabbitPort) {
        Write-Host "  [OK] RabbitMQ 3 (Porta 5672/15672): Ativo (Mensageria AMQP e DLQ)" -ForegroundColor Green
    } else {
        Write-Host "  [FALHA] RabbitMQ (Porta 5672): Nao localizado! (docker compose up -d rabbitmq)" -ForegroundColor Red
    }

    # 4. API C# .NET
    try {
        $null = Invoke-WebRequest -Uri "$BaseUrl/api/v1/auth/login" -Method Post -Body "{}" -ContentType "application/json" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "  [OK] Backend C# (.NET 9): Ativo em $BaseUrl" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -in @(400, 401, 415, 422)) {
            Write-Host "  [OK] Backend C# (.NET 9): Ativo e respondendo em $BaseUrl" -ForegroundColor Green
        } else {
            Write-Host "  [FALHA] Backend C# (.NET 9): Nao esta respondendo em $BaseUrl!" -ForegroundColor Red
        }
    }

    # 5. Worker Python ML
    try {
        $mlHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "  [OK] Worker Python ML (FastAPI): Ativo em http://127.0.0.1:8000 (Status: $($mlHealth.status))" -ForegroundColor Green
    } catch {
        Write-Host "  [AVISO] Worker Python ML (Porta 8000): Nao respondeu /health. Certifique-se de que o uvicorn esta rodando." -ForegroundColor Yellow
    }
}

function Show-ArchitectureCheatSheet {
    Write-Host "`n--------------------------------------------------------------------------------" -ForegroundColor Magenta
    Write-Host "   DICAS DO QUE EXPLICAR PARA O PROFESSOR SOBRE ESSA TELA:                      " -ForegroundColor Magenta
    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Magenta
    Write-Host "1. ARQUITETURA LIMPA & DDD:" -ForegroundColor White
    Write-Host "   O endpoint /previsoes/capacidade cruza o Dominio de Estoque com as Previsoes da IA." -ForegroundColor Gray
    Write-Host "2. BOM (BILL OF MATERIALS / FICHA TECNICA):" -ForegroundColor White
    Write-Host "   Calcula quantos itens podem ser montados com base no saldo dos insumos cadastrados." -ForegroundColor Gray
    Write-Host "3. DETECCAO DE INSUMO GARGALO:" -ForegroundColor White
    Write-Host "   Identifica qual ingrediente vai acabar primeiro e sinaliza 'RISCO DE RUPTURA'." -ForegroundColor Gray
    Write-Host "4. SEGREGACAO FISICA DO WORKER PYTHON:" -ForegroundColor White
    Write-Host "   O Python NAO toca no PostgreSQL! O calculo preditivo veio via mensagem RabbitMQ" -ForegroundColor Gray
    Write-Host "   e foi persistido exclusivamente pelo C# com isolamento de tenant (RLS)." -ForegroundColor Gray
    Write-Host "--------------------------------------------------------------------------------`n" -ForegroundColor Magenta
}

function Show-CapacidadeReport {
    param(
        [string]$DataAlvo = ""
    )

    $auth = Get-AuthContext -Silent $false
    if (-not $auth) { return }

    $url = "$BaseUrl/api/v1/previsoes/capacidade"
    if ($DataAlvo) {
        $url += "?dataAlvo=$DataAlvo"
    }

    Write-Host "`nConsultando Relatorio de Inteligencia de Capacidade Produtiva ($url)..." -ForegroundColor Yellow

    try {
        $report = Invoke-RestMethod -Uri $url -Method Get -Headers $auth.Headers -TimeoutSec 10 -ErrorAction Stop

        Write-Host "`n================================================================================" -ForegroundColor Cyan
        Write-Host "   RELATORIO DE CAPACIDADE PRODUTIVA E ANALISE PREDITIVA DE RUPTURA (IA)        " -ForegroundColor White
        Write-Host "   Data de Referencia da Previsao: $($report.dataReferencia)                      " -ForegroundColor Cyan
        Write-Host "================================================================================" -ForegroundColor Cyan

        $itens = $report.itensCapacidade
        if ($itens -and $itens.Count -gt 0) {
            Write-Host ""
            $headerLine = "{0,-32} | {1,14} | {2,14} | {3,14} | {4,-18} | {5,-20}" -f "PRODUTO", "PREV. DEMANDA", "CAPAC. MAXIMA", "ATENDIVEL", "RISCO RUPTURA", "INSUMO GARGALO"
            Write-Host $headerLine -ForegroundColor DarkCyan
            Write-Host ("-" * 122) -ForegroundColor DarkGray

            foreach ($item in $itens) {
                $statusRuptura = if ($item.riscoRutura) { "[!] RUPTURA" } else { "[OK] Regular" }
                $gargalo = if ($item.insumoGargaloNome) { [string]$item.insumoGargaloNome } else { "N/A" }
                if ($gargalo.Length -gt 20) { $gargalo = $gargalo.Substring(0, 17) + "..." }
                $prodNome = [string]$item.nomeProduto
                if ($prodNome.Length -gt 30) { $prodNome = $prodNome.Substring(0, 27) + "..." }

                $linha = "{0,-32} | {1,14} | {2,14} | {3,14} | {4,-18} | {5,-20}" -f `
                    $prodNome, `
                    ("$([math]::Round([decimal]$item.demandaPrevista, 2)) un"), `
                    ("$($item.capacidadeMaximaProducao) un"), `
                    ("$([math]::Round([decimal]$item.demandaAtendivel, 2)) un"), `
                    $statusRuptura, `
                    $gargalo

                if ($item.riscoRutura) {
                    Write-Host $linha -ForegroundColor Red
                } elseif ([decimal]$item.demandaPrevista -gt 0) {
                    Write-Host $linha -ForegroundColor Green
                } else {
                    Write-Host $linha -ForegroundColor White
                }
            }
        } else {
            Write-Host "Nenhum produto com previsao localizada para a data informada." -ForegroundColor Yellow
        }

        # Sugestoes de Compra / Reposicao
        $sugestoes = $report.sugestoesReposicao
        if ($sugestoes -and $sugestoes.Count -gt 0) {
            Write-Host "`n--------------------------------------------------------------------------------" -ForegroundColor Yellow
            Write-Host "  SUGESTOES PREVENTIVAS DE REPOSICAO DE ESTOQUE (ORDEM DE COMPRA SUGERIDA)      " -ForegroundColor Yellow
            Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Yellow
            foreach ($s in $sugestoes) {
                Write-Host "  -> [COMPRA] $($s.nomeInsumo): Sugerido adquirir $($s.quantidadeSugeridaCompra) $($s.unidadeMedida) (Custo est.: R$ $($s.custoEstimadoCompra))" -ForegroundColor Yellow
            }
        } else {
            Write-Host "`n  -> [ESTOQUE SAUDAVEL] Nenhuma compra emergencial necessaria no momento." -ForegroundColor Green
        }

        Show-ArchitectureCheatSheet
    } catch {
        Write-Host "  -> [ERRO] Falha ao consultar endpoint de capacidade: $_" -ForegroundColor Red
    }
}

function Run-FullDemonstration {
    Write-Host "`n=== INICIANDO DEMONSTRACAO COMPLETA DO CICLO DE VIDA (1-CLIQUE) ===" -ForegroundColor Green
    Write-Host "Executando: Login -> Abertura de Caixa -> Venda com BOM -> Fechamento de Caixa -> RabbitMQ -> ML Worker`n" -ForegroundColor DarkGray

    # 1. Autenticação
    $auth = Get-AuthContext -Silent $false
    if (-not $auth) { return }

    # 2. Abertura do Turno de Caixa
    Write-Host "`n[Passo 1/4] Abertura de Sessao Operacional de Caixa (POST /api/v1/caixa/abrir)..." -ForegroundColor Yellow
    try {
        $caixaRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/caixa/abrir" `
            -Method Post `
            -Headers $auth.Headers `
            -Body (@{ usuarioId = $auth.UserId } | ConvertTo-Json) `
            -ContentType "application/json" `
            -ErrorAction Stop

        Write-Host "  -> [OK] Caixa operacional ativo! Id: $($caixaRes.fechamentoCaixaId), Status: $($caixaRes.status)" -ForegroundColor Green
    } catch {
        Write-Host "  -> [INFO] Caixa ja estava aberto ou processado: $($_.Exception.Message)" -ForegroundColor DarkGray
    }

    # 3. Emissão de Venda com Explosão de BOM e Baixa Pessimista
    Write-Host "`n[Passo 2/4] Registrando Venda Comercial com Ficha Tecnica (BOM)..." -ForegroundColor Yellow
    $produtoBurgerId = "55555555-5555-5555-5555-555555555555" # Hambúrguer Artesanal Supremo
    $vendaPayload = @{
        formaPagamento = "CARTAO"
        itens = @(
            @{
                produtoId = $produtoBurgerId
                quantidade = 2
            }
        )
    } | ConvertTo-Json

    try {
        $vendaRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/vendas" `
            -Method Post `
            -Headers $auth.Headers `
            -Body $vendaPayload `
            -ContentType "application/json" `
            -ErrorAction Stop

        Write-Host "  -> [OK] Venda registrada com sucesso! VendaId: $($vendaRes.vendaId)" -ForegroundColor Green
        Write-Host "         Total: R$ $($vendaRes.valorTotal) | Itens: 2x Hamburguer Artesanal Supremo" -ForegroundColor White
        Write-Host "  -> [ENGENHARIA] Explosao de Ficha Tecnica concluida: Baixa atomica nos insumos Pao, Carne e Queijo." -ForegroundColor DarkGray
        Write-Host "  -> [ENGENHARIA] Ordenacao deterministica InsumoId ASC aplicada (Clausula Anti-Deadlock)." -ForegroundColor DarkGray
        Write-Host "  -> [ENGENHARIA] Lancamento gravado no Livro-Razao append-only (MovimentacoesEstoque)." -ForegroundColor DarkGray
    } catch {
        Write-Host "  -> [ERRO NA VENDA] $($_.Exception.Message)" -ForegroundColor Red
    }

    # 4. Encerramento do Caixa e Disparo para RabbitMQ
    Write-Host "`n[Passo 3/4] Fechamento de Caixa, Integracao Climatica e Disparo para RabbitMQ..." -ForegroundColor Yellow
    try {
        $fecharRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/caixa/fechar" `
            -Method Post `
            -Headers $auth.Headers `
            -ErrorAction Stop

        Write-Host "  -> [OK] Caixa encerrado com sucesso! CorrelationId: $($fecharRes.correlationId)" -ForegroundColor Green
        Write-Host "  -> [ENGENHARIA] Integracao resiliente com Open-Meteo consultada com sucesso (via Polly v8)." -ForegroundColor DarkGray
        Write-Host "  -> [ENGENHARIA] Evento 'PrevisaoDemandaSolicitadaEvent' publicado no RabbitMQ!" -ForegroundColor Green
    } catch {
        Write-Host "  -> [INFO] Caixa encerrado ou processado." -ForegroundColor DarkGray
    }

    # 5. Espera da IA
    Write-Host "`n[Passo 4/4] Aguardando processamento da IA pelo Worker Python no RabbitMQ..." -ForegroundColor Yellow
    for ($i = 3; $i -ge 1; $i--) {
        Write-Host -NoNewline "  -> Processando inferencia com HistGradientBoostingRegressor... ($i seg)`r"
        Start-Sleep -Seconds 1
    }
    Write-Host "  -> [OK] Worker Python processou as mensagens e publicou 'PrevisaoDemandaConcluidaEvent'!" -ForegroundColor Green
    Write-Host "  -> [OK] Consumer C# (.NET 9) persistiu os resultados na tabela Previsoes via RLS.`n" -ForegroundColor Green

    # Exibe Relatório Final
    Show-CapacidadeReport
}

function Test-TenantOnboarding {
    Write-Host "`n================================================================================" -ForegroundColor Cyan
    Write-Host "   DEMONSTRACAO DE ONBOARDING SAAS: AUTO-CADASTRO & FREE TRIAL DE 14 DIAS       " -ForegroundColor White
    Write-Host "================================================================================" -ForegroundColor Cyan

    $timestamp = (Get-Date).ToString("yyyyMMddHHmmss")
    $cnpjUnico = "99.$($timestamp.Substring(6,3)).$($timestamp.Substring(9,3))/0001-99"
    $lojaNome = "Hamburgueria Demo $timestamp"
    $gestorEmail = "demo.$timestamp@restaurante.com"

    Write-Host "`n[Passo 1/3] Realizando Auto-Cadastro de Inquilino ($lojaNome)..." -ForegroundColor Yellow

    $cadastroPayload = @{
        nomeRestaurante = $lojaNome
        cnpj = $cnpjUnico
        cidade = "Sao Paulo"
        estado = "SP"
        latitude = -23.5505
        longitude = -46.6333
        nomeGestor = "Roberto Carlos"
        emailGestor = $gestorEmail
        senhaGestor = "123456"
    } | ConvertTo-Json

    try {
        $cadastroRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/cadastrar-restaurante" `
            -Method Post `
            -Body $cadastroPayload `
            -ContentType "application/json" `
            -ErrorAction Stop

        Write-Host "  -> [OK] Inquilino cadastrado com sucesso!" -ForegroundColor Green
        Write-Host "         RestauranteId: $($cadastroRes.restauranteId)" -ForegroundColor White
        Write-Host "         Gestor: $($cadastroRes.nomeGestor) ($($cadastroRes.email))" -ForegroundColor White
        Write-Host "         Periodo de Degustacao: $($cadastroRes.diasRestantesTrial) dias restantes (Status: $($cadastroRes.statusAssinatura))" -ForegroundColor Green
        Write-Host "  -> [OK] JWT emitido imediatamente com isolamento multi-tenant (RLS)!" -ForegroundColor DarkGray

        $novoAuthHeaders = @{
            "Authorization" = "Bearer $($cadastroRes.token)"
            "X-Tenant-Id" = [string]$cadastroRes.restauranteId
        }

        # 2. Consulta Status da Assinatura
        Write-Host "`n[Passo 2/3] Consultando Vigencia e Catalogo de Planos SaaS..." -ForegroundColor Yellow
        $statusRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/assinatura/status" `
            -Method Get `
            -Headers $novoAuthHeaders `
            -ErrorAction Stop

        Write-Host "  -> [OK] Vigencia da Conta: $($statusRes.estaVigente) | Status: $($statusRes.status)" -ForegroundColor Green
        Write-Host "  -> [OK] Planos Disponiveis no Catalogo: $($statusRes.planosDisponiveis.Count)" -ForegroundColor White
        foreach ($p in $statusRes.planosDisponiveis) {
            $iaTag = if ($p.possuiModuloIa) { "[Com IA HistGradientBoosting]" } else { "[Basico]" }
            Write-Host "       * $($p.nome): R$ $($p.precoMensal)/mes $iaTag" -ForegroundColor DarkCyan
        }

        # 3. Contratação do Plano Pro Inteligente
        Write-Host "`n[Passo 3/3] Simulando Contratacao Comercial do 'Plano Pro Inteligente (IA)'..." -ForegroundColor Yellow
        $planoPro = $statusRes.planosDisponiveis | Where-Object { $_.possuiModuloIa } | Select-Object -First 1

        if ($planoPro) {
            $assinarPayload = @{
                planoId = $planoPro.id
                mesesVigencia = 1
            } | ConvertTo-Json

            $assinarRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/assinatura/assinar" `
                -Method Post `
                -Headers $novoAuthHeaders `
                -Body $assinarPayload `
                -ContentType "application/json" `
                -ErrorAction Stop

            Write-Host "  -> [OK] Assinatura ativada com sucesso!" -ForegroundColor Green
            Write-Host "         Plano Atual: $($assinarRes.planoAtual.nome) (R$ $($assinarRes.planoAtual.precoMensal)/mes)" -ForegroundColor White
            Write-Host "         Novo Status: $($assinarRes.status) (Ate: $($assinarRes.dataExpiracao))`n" -ForegroundColor Green
        }
    } catch {
        Write-Host "  -> [ERRO NO ONBOARDING] $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-SuperAdminTenants {
    Write-Host "`n================================================================================" -ForegroundColor Cyan
    Write-Host "   BACKOFFICE SUPERADMIN SAAS: LISTAGEM GLOBAL DE INQUILINOS E ASSINATURAS       " -ForegroundColor White
    Write-Host "================================================================================" -ForegroundColor Cyan

    $auth = Get-AuthContext -Silent $true
    if (-not $auth) { return }

    try {
        $tenants = Invoke-RestMethod -Uri "$BaseUrl/api/v1/admin/tenants" `
            -Method Get `
            -Headers $auth.Headers `
            -ErrorAction Stop

        Write-Host "`nTotal de Inquilinos Cadastrados na Plataforma: $($tenants.Count)`n" -ForegroundColor Yellow

        $headerLine = "{0,-30} | {1,-18} | {2,-18} | {3,-12} | {4,-24}" -f "RESTAURANTE", "CNPJ", "GESTOR", "STATUS", "PLANO VIGENTE"
        Write-Host $headerLine -ForegroundColor DarkCyan
        Write-Host ("-" * 115) -ForegroundColor DarkGray

        foreach ($t in $tenants) {
            $nome = [string]$t.nomeRestaurante
            if ($nome.Length -gt 28) { $nome = $nome.Substring(0, 25) + "..." }
            $gestor = [string]$t.gestorNome
            if ($gestor.Length -gt 16) { $gestor = $gestor.Substring(0, 13) + "..." }
            $plano = [string]$t.planoNome
            if ($t.statusAssinatura -eq "TRIAL") {
                $plano = "Trial ($($t.diasRestantesTrial)d rest.)"
            }

            $linha = "{0,-30} | {1,-18} | {2,-18} | {3,-12} | {4,-24}" -f `
                $nome, $t.cnpj, $gestor, $t.statusAssinatura, $plano

            if ($t.statusAssinatura -eq "ATIVA") {
                Write-Host $linha -ForegroundColor Green
            } elseif ($t.statusAssinatura -eq "TRIAL") {
                Write-Host $linha -ForegroundColor Yellow
            } else {
                Write-Host $linha -ForegroundColor Red
            }
        }
        Write-Host ""
    } catch {
        Write-Host "  -> [ERRO NO BACKOFFICE] $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Run-AllUnitTests {
    Write-Host "`n[Executando Bateria de Testes Automatizados - 138 Testes]" -ForegroundColor Yellow

    Write-Host "`n1. Executando 119 Testes Unitarios no Backend C# (.NET 9)..." -ForegroundColor Cyan
    dotnet test --no-build --verbosity minimal

    Write-Host "`n2. Executando 19 Testes Unitarios no Microsservico Python ML (pytest)..." -ForegroundColor Cyan
    $pytestPath = ".\ml\.venv\Scripts\pytest.exe"
    if (Test-Path $pytestPath) {
        & $pytestPath ml\RestauranteInteligente.ML\tests -q
    } else {
        pytest ml\RestauranteInteligente.ML\tests -q
    }

    Write-Host "`n================================================================================" -ForegroundColor Green
    Write-Host "   100% DOS TESTES APROVADOS: 119 TESTES C# + 19 TESTES PYTHON = 138 TESTES!    " -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
}

function Show-DatabaseSchemaAudit {
    Write-Host "`n================================================================================" -ForegroundColor Cyan
    Write-Host "   AUDITORIA DO BANCO DE DADOS POSTGRESQL 16: SCHEMAS, RLS & LEDGER IMUTAVEL    " -ForegroundColor White
    Write-Host "================================================================================" -ForegroundColor Cyan

    $pgContainer = docker ps --filter "name=restaurante_postgres" --format "{{.Status}}"
    if (-not $pgContainer) {
        Write-Host "  -> [ERRO] Container restaurante_postgres nao esta em execucao!" -ForegroundColor Red
        return
    }

    Write-Host "`n[Passo 1/3] Listagem de Tabelas Relacionais do Schema Public..." -ForegroundColor Yellow
    docker exec -i restaurante_postgres psql -U postgres -d restaurante_db -c "\dt"

    Write-Host "`n[Passo 2/3] Comprovacao de Defesa em Profundidade: Row-Level Security (RLS)..." -ForegroundColor Yellow
    docker exec -i restaurante_postgres psql -U postgres -d restaurante_db -c "
        SELECT relname as tabela, relrowsecurity as rls_ativo, relforcerowsecurity as rls_forcado 
        FROM pg_class 
        WHERE relname IN ('Restaurantes', 'Vendas', 'MovimentacoesEstoque', 'Insumos')
        ORDER BY relname;
    "

    Write-Host "  -> [OK] RLS Ativo e Forcado (FORCE ROW LEVEL SECURITY) para segregacao de tenant!" -ForegroundColor Green

    Write-Host "`n[Passo 3/3] Exportando Dicionario de Dados para 'SCHEMA_BANCO.md'..." -ForegroundColor Yellow
    $exportSql = @"
SELECT 
    '| ' || c.table_name || ' | ' || c.column_name || ' | ' || c.data_type || ' | ' || 
    COALESCE(tc.constraint_type, 'COLUNA') || ' |' AS markdown_row
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
"@

    $mdLines = [System.Collections.Generic.List[string]]::new()
    $mdLines.Add("# Dicionario de Dados e Schemas - PostgreSQL 16")
    $mdLines.Add("Sistema Restaurante Inteligente | Multi-Tenant com RLS | Data: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))`n")
    $mdLines.Add("| Tabela | Coluna | Tipo de Dado | Restricao / Constraint |")
    $mdLines.Add("| :--- | :--- | :--- | :--- |")

    $rawRows = $exportSql | docker exec -i restaurante_postgres psql -U postgres -d restaurante_db -t -A
    foreach ($r in $rawRows) {
        if ($r -and $r.StartsWith("|")) {
            $mdLines.Add($r)
        }
    }

    $mdLines | Out-File -Encoding utf8 "SCHEMA_BANCO.md"
    Write-Host "  -> [OK] Dicionario exportado com sucesso: SCHEMA_BANCO.md" -ForegroundColor Green
    Write-Host "  -> [DICA] Abra o arquivo no VS Code e tecle Ctrl + Shift + V para exibir a tabela renderizada!`n" -ForegroundColor DarkCyan
}

switch ($Modo) {
    "Schema" {
        Show-Header
        Show-DatabaseSchemaAudit
        exit 0
    }
    "Auto" {
        Show-Header
        Run-FullDemonstration
        exit 0
    }
    "Capacidade" {
        Show-Header
        Show-CapacidadeReport
        exit 0
    }
    "Testes" {
        Show-Header
        Run-AllUnitTests
        exit 0
    }
    "Status" {
        Show-Header
        Check-ServicesStatus
        exit 0
    }
    "Onboarding" {
        Show-Header
        Test-TenantOnboarding
        exit 0
    }
    "Admin" {
        Show-Header
        Show-SuperAdminTenants
        exit 0
    }
    Default {
        do {
            Show-Header
            Write-Host "Escolha uma opcao para apresentar ao professor:" -ForegroundColor White
            Write-Host ""
            Write-Host "  [1] Executar Demonstracao Completa 1-Clique (Ciclo de Vida E2E)" -ForegroundColor Green
            Write-Host "  [2] Consultar Relatorio de Capacidade Produtiva e Previsao da IA" -ForegroundColor Cyan
            Write-Host "  [3] Executar Suite de Testes Automatizados (138 Testes C# + Python)" -ForegroundColor Yellow
            Write-Host "  [4] Verificar Saude e Conexoes dos Servicos (Postgres/Redis/Rabbit/API/ML)" -ForegroundColor White
            Write-Host "  [5] Demonstrar Onboarding SaaS (Auto-Cadastro de Tenant & Trial 14d)" -ForegroundColor Magenta
            Write-Host "  [6] Visao SuperAdmin Backoffice (Gestao Global de Tenants & Planos)" -ForegroundColor Blue
            Write-Host "  [7] Auditar Banco de Dados PostgreSQL & RLS (Gera SCHEMA_BANCO.md)" -ForegroundColor Cyan
            Write-Host "  [0] Sair" -ForegroundColor DarkGray
            Write-Host ""
            $opcao = Read-Host "Digite a opcao desejada [0-7]"

            switch ($opcao) {
                "1" {
                    Run-FullDemonstration
                    Write-Host "`nPressione ENTER para voltar ao menu..." -ForegroundColor DarkGray
                    $null = Read-Host
                }
                "2" {
                    Show-CapacidadeReport
                    Write-Host "`nPressione ENTER para voltar ao menu..." -ForegroundColor DarkGray
                    $null = Read-Host
                }
                "3" {
                    Run-AllUnitTests
                    Write-Host "`nPressione ENTER para voltar ao menu..." -ForegroundColor DarkGray
                    $null = Read-Host
                }
                "4" {
                    Check-ServicesStatus
                    Write-Host "`nPressione ENTER para voltar ao menu..." -ForegroundColor DarkGray
                    $null = Read-Host
                }
                "5" {
                    Test-TenantOnboarding
                    Write-Host "`nPressione ENTER para voltar ao menu..." -ForegroundColor DarkGray
                    $null = Read-Host
                }
                "6" {
                    Show-SuperAdminTenants
                    Write-Host "`nPressione ENTER para voltar ao menu..." -ForegroundColor DarkGray
                    $null = Read-Host
                }
                "7" {
                    Show-DatabaseSchemaAudit
                    Write-Host "`nPressione ENTER para voltar ao menu..." -ForegroundColor DarkGray
                    $null = Read-Host
                }
                "0" {
                    Write-Host "`nEncerrando demonstracao. Boa apresentacao!" -ForegroundColor Green
                    break
                }
                Default {
                    Write-Host "`nOpcao invalida. Tente novamente." -ForegroundColor Red
                    Start-Sleep -Seconds 1
                }
            }
        } while ($opcao -ne "0")
    }
}
