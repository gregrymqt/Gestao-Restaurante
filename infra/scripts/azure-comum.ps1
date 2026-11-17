$ErrorActionPreference = 'Stop'
$AzureSubscription = 'f3f6007a-aeb4-424a-9763-fd77fa378106'
$AzureProduction = 'rg-restaurante-inteligente-prod'
$AzureVm = 'vm-restaurante-prod'
$AzureLocal = Join-Path $env:LOCALAPPDATA 'RestauranteInteligente-Azure'
$AzureRepo = (Resolve-Path "$PSScriptRoot/../..").Path
$AzureTerraform = Join-Path $AzureRepo 'infra/terraform'
$AzureBackupFiles = @('aplicacao.tar.gz','volumes.tar.gz','postgres.dump',
    'postgres-counts.txt','rabbitmq-hostname.txt','SHA256SUMS')

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command falhou (codigo $LASTEXITCODE)."
    }
}

function Assert-AzureGroup {
    param([string]$Group)
    if ($Group -ne $AzureProduction -and $Group -cnotmatch '^rg-restaurante-inteligente-teste-[a-z0-9]{1,20}$') {
        throw "Grupo fora do escopo do Restaurante: $Group"
    }
}

function Get-AzureStatePath {
    param([string]$Group)
    Join-Path $AzureLocal "state/$Group/terraform.tfstate"
}

function Invoke-Azure {
    param([string[]]$Arguments)
    $ErrorActionPreference = 'Continue'
    $PSNativeCommandUseErrorActionPreference = $false
    $cliArguments = $Arguments + @('--subscription', $AzureSubscription, '--only-show-errors')
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        $result = & az @cliArguments 2>&1
        $code = $LASTEXITCODE
        if ($code -eq 0) {
            $result | Where-Object { $_ -is [string] }
            return
        }
        $message = $result -join "`n"
        if ($attempt -eq 3 -or $message -notmatch 'Failed to resolve|getaddrinfo failed|Temporary failure in name resolution') {
            throw "Azure CLI falhou (codigo $code).`n$message"
        }
        Start-Sleep -Seconds (5 * $attempt)
    }
}

function Invoke-RestauranteTerraform {
    param([string[]]$Arguments)
    $previousSubscription = $env:ARM_SUBSCRIPTION_ID
    try {
        $env:ARM_SUBSCRIPTION_ID = $AzureSubscription
        Invoke-Checked terraform (@("-chdir=$AzureTerraform") + $Arguments)
    } finally {
        $env:ARM_SUBSCRIPTION_ID = $previousSubscription
    }
}

function Get-RestauranteHostKey {
    param([string]$Group, [string]$Address)
    $result = Invoke-Azure @('vm','run-command','invoke','-g',$Group,'-n',$AzureVm,
        '--command-id','RunShellScript','--scripts','cat /etc/ssh/ssh_host_ed25519_key.pub',
        '--query','value[0].message','-o','tsv')
    $key = [regex]::Match(($result -join "`n"), '(?m)^ssh-ed25519 [A-Za-z0-9+/=]+').Value
    if (!$key) { throw "Nao foi possivel verificar a chave SSH de $Group pelo Azure." }
    $knownHosts = Join-Path $AzureLocal "state/$Group/known_hosts"
    New-Item -ItemType Directory -Force (Split-Path $knownHosts) | Out-Null
    Set-Content -LiteralPath $knownHosts -Value "$Address $key" -Encoding Ascii
    $knownHosts
}

function Get-RestauranteSshOptions {
    param([string]$Key, [string]$KnownHosts)
    @('-i', $Key, '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes',
      '-o', 'ConnectTimeout=15', '-o', 'StrictHostKeyChecking=yes',
      '-o', "UserKnownHostsFile=$KnownHosts")
}

function Get-AzureGroupExists {
    param([string]$Group)
    (Invoke-Azure @('group','exists','-n',$Group,'-o','tsv')) -eq 'true'
}

function Assert-RestauranteBackup {
    param([string]$Directory)
    $manifest = @(Get-Content -LiteralPath (Join-Path $Directory 'SHA256SUMS'))
    foreach ($file in $AzureBackupFiles | Where-Object { $_ -ne 'SHA256SUMS' }) {
        $path = Join-Path $Directory $file
        $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        if ((Get-Item -LiteralPath $path).Length -eq 0 -or "$hash  $file" -cnotin $manifest) {
            throw "Backup incompleto ou checksum invalido: $file"
        }
    }
}
