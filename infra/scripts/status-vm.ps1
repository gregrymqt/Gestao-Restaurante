. "$PSScriptRoot/azure-comum.ps1"
Invoke-Azure @('vm','get-instance-view','-g',$AzureProduction,'-n',$AzureVm,
    '--query','{Name:name, Status:instanceView.statuses[1].displayStatus}','-o','table')
