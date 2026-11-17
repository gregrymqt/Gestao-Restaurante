[CmdletBinding()]
param(
    [string]$Grupo = 'rg-restaurante-inteligente-prod',
    [string]$ConfirmarGrupo,
    [string]$ChavePublica = (Join-Path $env:LOCALAPPDATA 'RestauranteInteligente-Azure/operacao-ed25519.pub'),
    [switch]$SemEstado,
    [switch]$SomentePreview
)

. "$PSScriptRoot/azure-comum.ps1"
Assert-AzureGroup $Grupo
if (!(Get-AzureGroupExists $Grupo)) {
    Write-Host "Grupo $Grupo ja esta ausente."
    return
}
Invoke-Azure @('resource','list','-g',$Grupo,'--query','[].{Nome:name,Tipo:type}','-o','table')
if ($SomentePreview) { return }
if (!$ConfirmarGrupo) { $ConfirmarGrupo = Read-Host 'Digite o nome exato do grupo para destruir' }
if ($ConfirmarGrupo -cne $Grupo) { throw 'Confirmacao incorreta.' }
$state = Get-AzureStatePath $Grupo
if ($SemEstado) {
    Invoke-Azure @('group','delete','--name',$Grupo,'--yes')
} else {
    if (!(Test-Path -LiteralPath $state)) { throw 'Estado local ausente. Para grupos legados, informe -SemEstado.' }
    $stateJson = Get-Content -Raw -LiteralPath $state | ConvertFrom-Json
    $trackedGroup = @($stateJson.resources | Where-Object { $_.type -eq 'azurerm_resource_group' -and $_.name -eq 'rg' })
    $expectedId = "/subscriptions/$AzureSubscription/resourceGroups/$Grupo"
    if ($trackedGroup.Count -ne 1 -or $trackedGroup[0].instances[0].attributes.id -ne $expectedId) {
        throw 'O grupo no estado Terraform nao corresponde ao alvo.'
    }
    Invoke-RestauranteTerraform @('init','-input=false','-lockfile=readonly')
    Invoke-RestauranteTerraform @('destroy','-input=false','-auto-approve',"-state=$state","-var=resource_group_name=$Grupo",
        "-var=ssh_public_key_path=$ChavePublica")
}
if (Get-AzureGroupExists $Grupo) { throw "O grupo $Grupo ainda existe." }
$remaining = Invoke-Azure @('resource','list','--query',"[?resourceGroup != null && tolower(resourceGroup)=='$($Grupo.ToLowerInvariant())'].id",'-o','tsv')
if ($remaining) { throw "Ainda ha recursos associados a $Grupo." }
Write-Host "Grupo $Grupo e seus recursos removidos."
