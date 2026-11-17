az vm get-instance-view --resource-group rg-restaurante-inteligente-prod --name vm-restaurante-prod --query "{Name:name, Status:instanceView.statuses[1].displayStatus}" -o table
