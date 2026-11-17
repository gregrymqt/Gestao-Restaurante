variable "location" {
  type        = string
  description = "Região Azure para provisionamento dos recursos"
  default     = "brazilsouth"
}

variable "resource_group_name" {
  type        = string
  description = "Nome do Resource Group"
  default     = "rg-restaurante-inteligente-prod"
}

variable "vm_size" {
  type        = string
  description = "Tamanho (SKU) da Máquina Virtual"
  default     = "Standard_D2s_v4"
}

variable "admin_username" {
  type        = string
  description = "Nome do usuário administrador da VM"
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  type        = string
  description = "Caminho da chave pública SSH"
  default     = "~/.ssh/id_ed25519.pub"
}
