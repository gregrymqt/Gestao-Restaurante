Write-Host "Iniciando VM vm-restaurante-prod na Azure..." -ForegroundColor Cyan
az vm start --resource-group rg-restaurante-inteligente-prod --name vm-restaurante-prod
Write-Host "VM iniciada com sucesso!" -ForegroundColor Green
Write-Host "Os servicos Docker (Caddy, WebAPI, ML Worker, Postgres, Redis, RabbitMQ) inicializam automaticamente com restart: always." -ForegroundColor Green
Write-Host "URL da API: https://20-197-194-139.sslip.io/api/v1/health" -ForegroundColor Green
