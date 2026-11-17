#!/usr/bin/env bash
set -euo pipefail
umask 077

release=${1:?Release directory required}
revision=${2:?Commit SHA required}
repository=${3:?GitHub repository required}
registry_user=${4:?GitHub actor required}
export WEBAPI_IMAGE="ghcr.io/$repository/webapi:$revision"
export ML_WORKER_IMAGE="ghcr.io/$repository/ml-worker:$revision"

docker_config=$(mktemp -d)
trap 'rm -rf "$docker_config"' EXIT
docker --config "$docker_config" login ghcr.io --username "$registry_user" --password-stdin

compose=(docker compose --project-directory "$PWD" --env-file "$PWD/.env" -f "$release/docker-compose.prod.yml")
test -f .env
"${compose[@]}" config --quiet
docker --config "$docker_config" image pull "$WEBAPI_IMAGE"
docker --config "$docker_config" image pull "$ML_WORKER_IMAGE"

# Require the existing production database and its configured Compose project.
postgres_id=$("${compose[@]}" ps -q postgres)
test -n "$postgres_id"
test "$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id")" = healthy

migration=$release/scripts/sql/03_modificadores_schema.sql
# Persist the completion record alongside the database backup on its own volume.
# Inside the DB, the migration takes effect atomically under ON_ERROR_STOP.
migration_checksum=$(sha256sum "$migration")
migration_checksum=${migration_checksum%% *}
marker="/var/lib/postgresql/backups/modificadores-$migration_checksum.applied"
if ! "${compose[@]}" exec -T postgres test -f "$marker"; then
    "${compose[@]}" exec -T postgres sh -ec '
        umask 077
        backup=$(mktemp /var/lib/postgresql/backups/pre-modificadores.XXXXXX)
        trap '\''rm -f "$backup"'\'' EXIT
        pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "$backup"
        pg_restore --list "$backup" >/dev/null
        mv "$backup" "$backup.dump"
        printf "Backup: %s.dump\n" "$backup"
    '
    "${compose[@]}" exec -T postgres sh -ec '
        export PGOPTIONS="-c lock_timeout=10s -c statement_timeout=300s"
        psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    ' < "$migration"
    "${compose[@]}" exec -T postgres touch "$marker"
fi

"${compose[@]}" up -d --no-build --no-deps --pull never --wait --wait-timeout 180 webapi ml-worker
for attempt in {1..30}; do
    if "${compose[@]}" exec -T caddy wget -q -O /dev/null http://webapi:5000/api/v1/health; then
        break
    fi
    if (( attempt == 30 )); then
        echo 'A API não respondeu ao health check.' >&2
        exit 1
    fi
    sleep 2
done
