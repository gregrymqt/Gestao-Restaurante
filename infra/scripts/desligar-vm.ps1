Write-Host "Desalocando VM vm-restaurante-prod para zerar custos de computacao..." -ForegroundColor Yellow
az vm deallocate --resource-group rg-restaurante-inteligente-prod --name vm-restaurante-prod
Write-Host "VM desalocada com sucesso!" -ForegroundColor Green
Write-Host "Custos de vCPU/RAM zerados. O IP estatico (20.197.194.139) e os volumes persistentes continuam preservados." -ForegroundColor Green
