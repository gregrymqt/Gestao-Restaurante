[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Capturar','TestarRestauracao','Religar')]
    [string]$Acao,
    [string]$Grupo = 'rg-restaurante-inteligente-prod',
    [string]$ChavePrivada = (Join-Path $env:LOCALAPPDATA 'RestauranteInteligente-Azure/operacao-ed25519'),
    [string]$Backup,
    [switch]$ManterParado
)

. "$PSScriptRoot/azure-comum.ps1"
Assert-AzureGroup $Grupo
if ($Acao -eq 'TestarRestauracao' -and $Grupo -eq $AzureProduction) {
    throw 'O teste de restauracao exige um grupo temporario.'
}
if ($Acao -ne 'Religar' -and !$Backup) { throw 'Informe o diretorio -Backup.' }
if ($Acao -eq 'Capturar') {
    $Backup = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Backup)
    if (Test-Path -LiteralPath $Backup) { throw 'O diretorio de backup precisa ser novo.' }
    if ($Backup.StartsWith("$AzureRepo\", [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Escolha um diretorio fora do repositorio para os dados de producao.'
    }
}
if ($Acao -eq 'TestarRestauracao') { Assert-RestauranteBackup $Backup }
$ChavePrivada = (Resolve-Path -LiteralPath $ChavePrivada).Path
$ip = Invoke-Azure @('vm','show','-d','-g',$Grupo,'-n',$AzureVm,'--query','publicIps','-o','tsv')
if ($ip -notmatch '^\d+\.\d+\.\d+\.\d+$') { throw 'A VM precisa de um IPv4 publico para backup via SSH.' }
$knownHosts = Get-RestauranteHostKey $Grupo $ip
$sshOptions = Get-RestauranteSshOptions $ChavePrivada $knownHosts
$destination = "azureuser@$ip"
$remoteStage = Invoke-Checked ssh ($sshOptions + @($destination, 'umask 077; mktemp -d'))
if ($remoteStage -cnotmatch '^/tmp/tmp\.[A-Za-z0-9]+$') { throw 'Diretorio temporario SSH invalido.' }
$capturing = $false
$captured = $false
try {
    Invoke-Checked scp ($sshOptions + @("$PSScriptRoot/azure-vm.sh", "${destination}:$remoteStage/"))
    switch ($Acao) {
        'Capturar' {
            New-Item -ItemType Directory -Path $Backup | Out-Null
            $capturing = $true
            Invoke-Checked ssh ($sshOptions + @($destination, "bash '$remoteStage/azure-vm.sh' backup '$remoteStage'"))
            foreach ($file in $AzureBackupFiles) {
                Invoke-Checked scp ($sshOptions + @("${destination}:$remoteStage/$file", $Backup))
            }
            Assert-RestauranteBackup $Backup
            $captured = $true
            Write-Host "Backup validado em $Backup"
        }
        'TestarRestauracao' {
            Invoke-Azure @('network','nsg','rule','create','-g',$Grupo,'--nsg-name','nsg-restaurante-prod',
                '-n','Isolar-Restauracao','--priority','100','--access','Deny','--protocol','Tcp',
                '--destination-port-ranges','80','443','-o','none')
            foreach ($file in $AzureBackupFiles) {
                Invoke-Checked scp ($sshOptions + @((Join-Path $Backup $file), "${destination}:$remoteStage/"))
            }
            Invoke-Checked ssh ($sshOptions + @($destination, "bash '$remoteStage/azure-vm.sh' restore-test '$remoteStage' teste-isolado"))
        }
        'Religar' {
            Invoke-Checked ssh ($sshOptions + @($destination, "bash '$remoteStage/azure-vm.sh' resume '$remoteStage'"))
        }
    }
} finally {
    try {
        if ($capturing -and (!$captured -or !$ManterParado)) {
            Invoke-Checked ssh ($sshOptions + @($destination, "bash '$remoteStage/azure-vm.sh' resume '$remoteStage'"))
        }
    } finally {
        & ssh @sshOptions $destination "rm -rf -- '$remoteStage'"
    }
}
