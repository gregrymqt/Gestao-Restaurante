# 🏛️ Infraestrutura & Topologia Distribuída - Restaurante Inteligente

Este diretório concentra as diretrizes, configurações de contêineres e topologia de rede do ecossistema **Restaurante Inteligente**, governado pelos princípios da skill canônica `infra-agent`.

---

## 🗺️ 1. Topologia de Rede & Gateway

O sistema utiliza o **Nginx Alpine** como Gateway Unificado e Reverse Proxy de borda, protegendo os serviços internos em uma rede Docker privada e expondo uma interface única para os clientes web/mobile:

```

[Cliente Web / Mobile] 
        │ Porta 80 (HTTP)
        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nginx Gateway (Alpine)                    │
│   - Rota /                  -> Frontend SPA (Expo Web)      │
│   - Rota /api/              -> Backend ASP.NET Core (.NET 9)│
│   - Rota /api/v1/events/sse -> SSE Streaming sem Buffer     │
│   - Rota /ml/               -> Worker ML Python (FastAPI)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     Rede Docker Privada: internal_backend_net│
               ▼                              ▼
┌──────────────────────────────┐┌─────────────────────────────┐
│  webapi (.NET 9)             ││  ml-worker (Python 3.12)    │
│  - Porta interna: 5000       ││  - Porta interna: 8000      │
└──────┬──────────────┬────────┘└──────────────┬──────────────┘
       │              │                        │
       ▼              ▼                        ▼
┌──────────────┐┌──────────────┐┌─────────────────────────────┐
│  PostgreSQL  ││  Redis 7     ││  RabbitMQ 3.13 (EDA)        │
│  16 (RLS)    ││  (Locks/SSE) ││  - AMQP: 5672               │
│  Porta: 5432 ││  Porta: 6379 ││  - Management UI: 15672     │
└──────────────┘└──────────────┘└─────────────────────────────┘
```

---

## 📦 2. Componentes da Infraestrutura

| Componente | Imagem Base | Porta Host | Rede Interna | Papel Arquitetural |
| :--- | :--- | :---: | :---: | :--- |
| **frontend** | `nginx:1.27-alpine` | `80:80` | `internal_backend_net` | Gateway de borda, servidor SPA do Expo Web e proxy reverso da API e SSE. |
| **webapi** | `mcr.microsoft.com/dotnet/aspnet:9.0` | `5000:5000` | `internal_backend_net` | API REST principal (.NET 9 / Clean Arch / RLS PostgreSQL / MassTransit). |
| **ml-worker** | `python:3.12-slim` | `8000:8000` | `internal_backend_net` | Processamento preditivo assíncrono desconectado do banco (Zero-SQL via RabbitMQ). |
| **postgres** | `postgres:16-alpine` | `5432:5432` | `internal_backend_net` | Banco relacional com RLS forçado, ledger append-only e WAL arquivado. |
| **redis** | `redis:7-alpine` | `6379:6379` | `internal_backend_net` | Distributed lock, sliding window rate limit, blacklist e barramento SSE. |
| **rabbitmq** | `rabbitmq:3.13-management` | `5672 / 15672` | `internal_backend_net` | Mensageria assíncrona orientada a eventos com DLX/DLQ e raw JSON. |

---

## ⚡ 3. Invariantes Críticas no Nginx (`infra/nginx/`)

1. **Streaming Reativo de Eventos SSE (`/api/v1/events/sse`):**
   - `proxy_buffering off;`: Impede o Nginx de reter fragmentos de dados do stream SSE em buffers de memória, garantindo entrega instantânea dos toasts de estoque crítico para o app móvel e web.
   - `proxy_read_timeout 3600s;`: Mantém a conexão aberta sem interrupção abrupta por timeout de inatividade.
2. **Fallback SPA para Expo Web (`try_files $uri $uri/ /index.html`):**
   - Permite que o roteamento baseado em arquivos do `expo-router` resolva URLs amigáveis sem gerar erro 404 ao recarregar páginas no navegador.
3. **Cache de Assets com Fingerprint:**
   - Assets estáticos com hash no nome (`_expo/static/`) recebem `Cache-Control: public, max-age=31536000, immutable`.
4. **Defesa em Profundidade:**
   - Headers nativos: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy` e remoção de identificadores com `server_tokens off;`.

---

## 🚀 4. Comandos Operacionais

```bash
# Subir todo o ecossistema com o Nginx Frontend integrado
docker compose up -d --build

# Inspecionar logs do Gateway Nginx
docker compose logs -f frontend

# Testar sintaxe de configuração do Nginx no contêiner
docker compose exec frontend nginx -t

# Recarregar configuração do Nginx a quente (sem downtime)
docker compose exec frontend nginx -s reload
```

---

## Ciclo de vida da produção no Azure

Execute a partir da raiz do repositório, no PowerShell, com Azure CLI autenticado,
Terraform, Git, OpenSSH e curl. Os scripts usam a assinatura Azure for Students do
Restaurante e aceitam o grupo de produção ou grupos temporários com o prefixo
`rg-restaurante-inteligente-teste-`. O estado e a chave de operação padrão ficam
em `%LOCALAPPDATA%\RestauranteInteligente-Azure`.

```powershell
$raiz = Join-Path $env:LOCALAPPDATA 'RestauranteInteligente-Azure'
$backup = Join-Path $raiz 'backups/producao'
$teste = 'rg-restaurante-inteligente-teste-ciclo'

# Cria um ambiente com credenciais de teste fornecidas em um arquivo .env reservado.
./infra/scripts/subir-azure.ps1 -Grupo $teste -ArquivoEnv "$raiz/teste.env" -SomentePlano
./infra/scripts/subir-azure.ps1 -Grupo $teste -ArquivoEnv "$raiz/teste.env"

# Captura a produção e deixa os serviços parados durante o teste.
./infra/scripts/backup-azure.ps1 -Acao Capturar -Backup $backup -ManterParado
./infra/scripts/backup-azure.ps1 -Acao TestarRestauracao -Grupo $teste -Backup $backup
./infra/scripts/destruir-azure.ps1 -Grupo $teste -ConfirmarGrupo $teste

# Caso seja necessário interromper a operação antes da exclusão.
./infra/scripts/backup-azure.ps1 -Acao Religar

# Depois de validar o backup, remove a produção legada.
./infra/scripts/destruir-azure.ps1 -SemEstado -SomentePreview
./infra/scripts/destruir-azure.ps1 -SemEstado -ConfirmarGrupo rg-restaurante-inteligente-prod

# Recria a produção e restaura o backup. -Revisao aceita um commit ou uma ref local.
./infra/scripts/subir-azure.ps1 -Backup $backup -Revisao HEAD

# Para destruir a produção recriada via Terraform, use a confirmação pelo nome.
./infra/scripts/destruir-azure.ps1 -ConfirmarGrupo rg-restaurante-inteligente-prod
```

Para provisionar com uma chave própria, informe `-ChavePrivada` ao subir e ao
capturar. Mantenha a chave pública correspondente com extensão `.pub` e use
`-ChavePublica` na destruição. O arquivo de configuração de um ambiente novo precisa
definir `POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `RABBITMQ_USER`,
`RABBITMQ_PASSWORD`, `JWT_KEY`, `INTERNAL_SERVICE_API_KEY` e
`MERCADO_PAGO_WEBHOOK_SECRET`.

O backup contém o `.env` de produção, o deploy e os volumes persistentes. Guarde-o em
armazenamento protegido fora do Azure e preserve o manifesto `SHA256SUMS`. O teste
de restauração bloqueia HTTP/HTTPS no grupo temporário, substitui seus volumes e
valida o PostgreSQL, Redis e RabbitMQ sem iniciar os consumidores da aplicação.
Após recriar a produção, use o endereço HTTPS exibido pelo script. Se o CD do
GitHub estiver ativo, atualize `PROD_SSH_HOST`, `PROD_SSH_KNOWN_HOSTS` e a
credencial `PROD_SSH_KEY` conforme a chave autorizada para a nova VM.
Com a VM online e os secrets configurados, defina a variável de repositório
`PROD_DEPLOY_ENABLED` como `true` e dispare o workflow na branch `main`.
Deixe essa variável desabilitada enquanto a produção estiver desprovisionada.
O CI e a publicação no GHCR continuam disponíveis durante esse período.
