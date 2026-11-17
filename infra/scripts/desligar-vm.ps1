. "$PSScriptRoot/azure-comum.ps1"
Write-Host "Desalocando VM $AzureVm para liberar a quota de computacao..." -ForegroundColor Yellow
Invoke-Azure @('vm','deallocate','-g',$AzureProduction,'-n',$AzureVm)
Write-Host "VM desalocada com sucesso!" -ForegroundColor Green
Write-Host "O IP estatico e o disco continuam provisionados." -ForegroundColor Green
