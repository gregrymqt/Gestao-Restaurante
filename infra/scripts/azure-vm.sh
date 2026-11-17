#!/usr/bin/env bash
set -euo pipefail
umask 077

action=${1:?}
stage=${2:?}
domain=${3:-}
cd /opt/restaurante-inteligente

compose() {
    local files=(-f docker-compose.prod.yml)
    if [[ -f azure-restore.compose.yml ]]; then
        files+=(-f azure-restore.compose.yml)
    fi
    docker compose --project-name restaurante-inteligente --env-file .env "${files[@]}" "$@"
}

database_counts() {
    compose exec -T postgres sh -ec '
        psql -X -qAt -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1"
    ' sh "$1" <<'SQL'
SELECT format('SELECT %L, count(*) FROM %I.%I;', tablename, schemaname, tablename)
FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
\gexec
SQL
}

check_backup() {
    local names=(aplicacao.tar.gz volumes.tar.gz postgres.dump postgres-counts.txt rabbitmq-hostname.txt)
    for name in "${names[@]}"; do
        grep -Eq "^[a-f0-9]{64}  $name$" "$stage/SHA256SUMS"
    done
    (cd "$stage"; sha256sum --check --strict SHA256SUMS)
}

restore_files() {
    check_backup
    local root
    root=$(docker info --format '{{.DockerRootDir}}')/volumes
    if [[ -n $(docker volume ls --quiet --filter 'name=restaurante-inteligente_') ]]; then
        echo 'A restauracao exige volumes novos. O ambiente atual foi preservado.' >&2
        return 1
    fi
    sudo tar -xzf "$stage/aplicacao.tar.gz" --no-same-owner -C "$PWD"
    sudo chown -R "$(id -u):$(id -g)" "$PWD"
    chmod 600 .env

    local rabbit
    rabbit=$(< "$stage/rabbitmq-hostname.txt")
    [[ $rabbit =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
    printf 'services:\n  rabbitmq:\n    hostname: "%s"\n' "$rabbit" > azure-restore.compose.yml

    sudo tar -xzf "$stage/volumes.tar.gz" -C "$root" --numeric-owner
    local volume
    for volume in caddy_config caddy_data postgres-backup postgres-data postgres-wal rabbitmq-data redis-data; do
        docker volume create --label com.docker.compose.project=restaurante-inteligente \
            --label "com.docker.compose.volume=$volume" "restaurante-inteligente_$volume" >/dev/null
    done
}

validate_restoration() (
    compose up -d --no-deps --wait --wait-timeout 180 postgres redis rabbitmq
    compose exec -T rabbitmq rabbitmqctl -q list_queues name >/dev/null
    database_counts restaurante_db > "$stage/physical-counts.txt"
    diff -q "$stage/postgres-counts.txt" "$stage/physical-counts.txt"
    local check_db="azure_restore_check_$RANDOM$RANDOM"
    compose exec -T postgres sh -ec 'createdb -U "$POSTGRES_USER" "$1"' sh "$check_db"
    trap 'compose exec -T postgres sh -ec '\''dropdb --if-exists -U "$POSTGRES_USER" "$1"'\'' sh "$check_db"' EXIT
    compose exec -T postgres sh -ec '
        umask 077
        dump=$(mktemp)
        trap '\''rm -f "$dump"'\'' EXIT
        cat > "$dump"
        pg_restore --list "$dump" >/dev/null
        pg_restore --exit-on-error -U "$POSTGRES_USER" -d "$1" "$dump"
    ' sh "$check_db" < "$stage/postgres.dump"
    database_counts "$check_db" > "$stage/logical-counts.txt"
    diff -q "$stage/postgres-counts.txt" "$stage/logical-counts.txt"
    compose exec -T postgres sh -ec 'dropdb -U "$POSTGRES_USER" "$1"' sh "$check_db"
    trap - EXIT
    echo 'Volumes restaurados, contagens conferidas e dump PostgreSQL restaurado.'
)

case "$action" in
    backup)
        exec 9>.production-deploy.lock
        flock -w 300 9
        compose config --quiet
        rabbit=$(compose ps -q rabbitmq)
        test -n "$rabbit"
        docker inspect --format '{{.Config.Hostname}}' "$rabbit" > "$stage/rabbitmq-hostname.txt"
        trap 'compose start >&2 || true' ERR
        compose stop caddy webapi ml-worker rabbitmq redis
        compose exec -T postgres sh -ec 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$stage/postgres.dump"
        compose exec -T postgres pg_restore --list < "$stage/postgres.dump" >/dev/null
        database_counts restaurante_db > "$stage/postgres-counts.txt"
        test -s "$stage/postgres-counts.txt"
        compose stop postgres
        sudo tar -czf "$stage/aplicacao.tar.gz" --exclude=./releases --exclude=./.git --exclude=./.production-deploy.lock .
        root=$(docker info --format '{{.DockerRootDir}}')/volumes
        volume_paths=()
        while IFS= read -r volume; do
            [[ $volume =~ ^restaurante-inteligente_(caddy_config|caddy_data|postgres-backup|postgres-data|postgres-wal|rabbitmq-data|redis-data)$ ]]
            test "$(docker volume inspect --format '{{.Mountpoint}}' "$volume")" = "$root/$volume/_data"
            volume_paths+=("$volume/_data")
        done < <(docker volume ls --quiet --filter label=com.docker.compose.project=restaurante-inteligente)
        test "${#volume_paths[@]}" -eq 7
        sudo tar -C "$root" -czf "$stage/volumes.tar.gz" "${volume_paths[@]}"
        sudo chown "$(id -u):$(id -g)" "$stage/"*.tar.gz
        chmod 600 "$stage/"*.tar.gz
        (cd "$stage"; sha256sum aplicacao.tar.gz volumes.tar.gz postgres.dump postgres-counts.txt rabbitmq-hostname.txt > SHA256SUMS)
        ;;
    resume)
        compose start
        ;;
    restore-test)
        [[ $domain == 'teste-isolado' ]]
        compose down --volumes
        restore_files
        validate_restoration
        compose stop
        ;;
    deploy)
        if [[ -f "$stage/SHA256SUMS" ]]; then
            restore_files
        else
            install -m 600 "$stage/config.env" .env
        fi
        # PostgreSQL and Caddy read their bind mounts as container users.
        (umask 022; tar -xzf "$stage/release.tar.gz" -C "$PWD")
        for name in POSTGRES_USER POSTGRES_PASSWORD REDIS_PASSWORD RABBITMQ_USER RABBITMQ_PASSWORD JWT_KEY INTERNAL_SERVICE_API_KEY MERCADO_PAGO_WEBHOOK_SECRET; do
            if ! grep -Eq "^$name=.+$" .env; then
                echo "Variavel ausente em .env: $name" >&2
                exit 1
            fi
        done
        sed -i -E '/^(DOMAIN_NAME|WEBAPI_IMAGE|ML_WORKER_IMAGE)=/d' .env
        printf '\nDOMAIN_NAME=%s\n' "$domain" >> .env
        compose config --quiet
        if [[ -f "$stage/SHA256SUMS" ]]; then
            validate_restoration
        else
            compose up -d --wait --wait-timeout 180 postgres redis rabbitmq
            database_counts restaurante_db > "$stage/initial-counts.txt"
            test -s "$stage/initial-counts.txt"
        fi
        compose exec -T -u root postgres install -d -o postgres -g postgres /var/lib/postgresql/backups/wal_archive
        compose build webapi ml-worker
        compose up -d --wait --wait-timeout 240
        for attempt in {1..30}; do
            if compose exec -T caddy wget -q -O /dev/null http://webapi:5000/api/v1/health; then
                break
            fi
            if (( attempt == 30 )); then exit 1; fi
            sleep 2
        done
        compose exec -T ml-worker curl -fsS -o /dev/null http://localhost:8000/health
        ;;
    *) exit 2 ;;
esac
