# Certificados SSL/TLS (Nginx)

Este diretório é reservado para certificados TLS (`server.crt` e `server.key`).

### Ativação de HTTPS (Porta 443) no Nginx

1. Adicione os arquivos do seu certificado neste diretório:
   - `server.crt` (Certificado público ou fullchain)
   - `server.key` (Chave privada)

2. No arquivo `infra/nginx/conf.d/default.conf`, adicione o bloco SSL:
```nginx
server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Demais locations iguais ao bloco da porta 80
}

# Redirecionamento de HTTP para HTTPS:
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$host$request_uri;
}
```

3. Mapeie o volume no `docker-compose.yml`:
```yaml
volumes:
  - ./infra/nginx/certs:/etc/nginx/certs:ro
```
