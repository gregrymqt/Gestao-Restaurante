output "public_ip" {
  description = "O IP público atribuído à VM"
  value       = azurerm_public_ip.pip.ip_address
}

output "domain_sslip" {
  description = "O domínio HTTPS automático formatado com traços"
  value       = "${replace(azurerm_public_ip.pip.ip_address, ".", "-")}.sslip.io"
}

output "ssh_command" {
  description = "Comando para conectar via SSH à VM"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.pip.ip_address}"
}
