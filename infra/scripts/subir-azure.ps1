[CmdletBinding()]
param(
    [string]$Grupo = 'rg-restaurante-inteligente-prod',
    [string]$ChavePrivada = (Join-Path $env:LOCALAPPDATA 'RestauranteInteligente-Azure/operacao-ed25519'),
    [string]$ArquivoEnv,
    [string]$Backup,
    [string]$Revisao = 'HEAD',
    [switch]$SomentePlano
)

. "$PSScriptRoot/azure-comum.ps1"
Assert-AzureGroup $Grupo
if ($ArquivoEnv -and $Backup) { throw 'Use -ArquivoEnv ou -Backup.' }
if (!$SomentePlano -and !$ArquivoEnv -and !$Backup) { throw 'Informe -ArquivoEnv ou -Backup.' }
$ChavePrivada = (Resolve-Path -LiteralPath $ChavePrivada).Path
[void](Resolve-Path -LiteralPath "$ChavePrivada.pub")
if ($ArquivoEnv) { $ArquivoEnv = (Resolve-Path -LiteralPath $ArquivoEnv).Path }
if ($Backup) {
    $Backup = (Resolve-Path -LiteralPath $Backup).Path
    Assert-RestauranteBackup $Backup
}
$commit = Invoke-Checked git @('-C',$AzureRepo,'rev-parse','--verify','--end-of-options',"${Revisao}^{commit}")
$state = Get-AzureStatePath $Grupo
$stateDirectory = Split-Path $state
New-Item -ItemType Directory -Force $stateDirectory | Out-Null
if (!(Test-Path -LiteralPath $state) -and (Get-AzureGroupExists $Grupo)) {
    throw "O grupo $Grupo ja existe e nao tem estado Terraform local."
}
Invoke-RestauranteTerraform @('init','-input=false','-lockfile=readonly')
Invoke-RestauranteTerraform @('validate')
$plan = Join-Path $stateDirectory 'criar.tfplan'
try {
    Invoke-RestauranteTerraform @('plan','-input=false',"-state=$state","-out=$plan",
        "-var=resource_group_name=$Grupo","-var=ssh_public_key_path=$ChavePrivada.pub")
    if ($SomentePlano) { return }
    Invoke-RestauranteTerraform @('apply','-input=false',"-state=$state",$plan)
} finally {
    if (Test-Path -LiteralPath $plan) { Remove-Item -LiteralPath $plan }
}
$ip = Invoke-RestauranteTerraform @('output',"-state=$state",'-raw','public_ip')
$domain = Invoke-RestauranteTerraform @('output',"-state=$state",'-raw','domain_sslip')
$knownHosts = Get-RestauranteHostKey $Grupo $ip
$sshOptions = Get-RestauranteSshOptions $ChavePrivada $knownHosts
$destination = "azureuser@$ip"
$release = Join-Path $stateDirectory 'release.tar.gz'
$remoteStage = Invoke-Checked ssh ($sshOptions + @($destination, 'umask 077; mktemp -d'))
if ($remoteStage -cnotmatch '^/tmp/tmp\.[A-Za-z0-9]+$') { throw 'Diretorio temporario SSH invalido.' }
try {
    Invoke-Checked ssh ($sshOptions + @($destination, 'sudo timeout 900 cloud-init status --wait && docker compose version'))
    Invoke-Checked git @('-C',$AzureRepo,'archive','--format=tar.gz','--output',$release,$commit)
    Invoke-Checked scp ($sshOptions + @($release, "$PSScriptRoot/azure-vm.sh", "${destination}:$remoteStage/"))
    if ($ArquivoEnv) {
        Invoke-Checked scp ($sshOptions + @($ArquivoEnv, "${destination}:$remoteStage/config.env"))
    } else {
        foreach ($file in $AzureBackupFiles) {
            Invoke-Checked scp ($sshOptions + @((Join-Path $Backup $file), "${destination}:$remoteStage/"))
        }
    }
    Invoke-Checked ssh ($sshOptions + @($destination, "bash '$remoteStage/azure-vm.sh' deploy '$remoteStage' '$domain'"))
    Invoke-Checked curl.exe @('--fail','--silent','--show-error','--max-time','10','--retry','30',
        '--retry-all-errors','--retry-delay','4',"https://$domain/api/v1/health")
    Write-Host "`nAmbiente disponivel em https://$domain"
} finally {
    & ssh @sshOptions $destination "rm -rf -- '$remoteStage'"
    if (Test-Path -LiteralPath $release) { Remove-Item -LiteralPath $release }
}
