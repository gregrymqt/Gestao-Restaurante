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
