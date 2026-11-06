# ==============================================================================
# Dockerfile Multi-Stage: Frontend Expo Web + Nginx Gateway
# ==============================================================================

# ------------------------------------------------------------------------------
# Estágio 1: Build estático do Expo Web (React Native Web)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências respeitando integridade de hashes
COPY src/frontend/package*.json ./
RUN npm ci

# Copia código fonte do frontend
COPY src/frontend/ ./

# Variáveis públicas de build para o Expo Router / Web
ENV EXPO_PUBLIC_API_URL=/api/v1 \
    EXPO_PUBLIC_API_ID=restaurante-inteligente-web \
    NODE_ENV=production

# Exporta bundle estático do Expo Web
RUN npx expo export --platform web

# ------------------------------------------------------------------------------
# Estágio 2: Imagem Nginx Alpine Minimalista de Produção
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove configurações e arquivos padrão
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copia configurações corporativas do Nginx
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infra/nginx/conf.d/ /etc/nginx/conf.d/

# Copia os artefatos estáticos exportados do estágio 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Checagem de integridade nativa via wget
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
