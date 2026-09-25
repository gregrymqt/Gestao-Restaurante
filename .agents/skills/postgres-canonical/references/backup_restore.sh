#!/usr/bin/env bash
# ==============================================================================
# Manual Canónico de Engenharia de Dados: PostgreSQL 16
# Rotina Canônica de Salvaguarda (Backup) e Retenção Operacional
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/lib/postgresql/backups}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-restaurante_postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-restaurante_db}"

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
ARQUIVO_DUMP="${BACKUP_DIR}/restaurante_prod_${TIMESTAMP}.dump"

echo "[INFO] [$(date -u)] Iniciando extração lógica integral: ${ARQUIVO_DUMP}"

# 1. Executa o dump customizado do PostgreSQL com compressão nativa interna (-F c)
docker exec -t "${POSTGRES_CONTAINER}" pg_dump \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  -F c \
  -b \
  -v \
  -f "/var/lib/postgresql/backups/restaurante_prod_${TIMESTAMP}.dump"

echo "[INFO] [$(date -u)] Cópia de segurança concluída com sucesso."

# 2. Higienização: remover backups locais com retenção superior a 48 horas
echo "[INFO] [$(date -u)] Limpando cópias de backup com idade superior a 48 horas..."
find "${BACKUP_DIR}" -name "restaurante_prod_*.dump" -type f -mtime +2 -delete

echo "[INFO] [$(date -u)] Rotina de backup finalizada com êxito."
