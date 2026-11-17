. "$PSScriptRoot/azure-comum.ps1"
Write-Host "Iniciando VM $AzureVm na Azure..." -ForegroundColor Cyan
Invoke-Azure @('vm','start','-g',$AzureProduction,'-n',$AzureVm)
$ip = Invoke-Azure @('network','public-ip','show','-g',$AzureProduction,'-n','pip-restaurante-prod',
    '--query','ipAddress','-o','tsv')
Write-Host "VM iniciada com sucesso!" -ForegroundColor Green
Write-Host "Os servicos Docker (Caddy, WebAPI, ML Worker, Postgres, Redis, RabbitMQ) inicializam automaticamente com restart: always." -ForegroundColor Green
Write-Host "URL da API: https://$($ip.Replace('.','-')).sslip.io/api/v1/health" -ForegroundColor Green
