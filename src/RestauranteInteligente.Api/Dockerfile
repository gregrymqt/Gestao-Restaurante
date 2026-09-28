# ==============================================================================
# Dockerfile Multi-Stage: Backend ASP.NET Core (.NET 9)
# ==============================================================================

FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /source

# Copia arquivos csproj para cacheamento otimizado de camadas do Docker
COPY src/RestauranteInteligente.Domain/*.csproj src/RestauranteInteligente.Domain/
COPY src/RestauranteInteligente.Application/*.csproj src/RestauranteInteligente.Application/
COPY src/RestauranteInteligente.Infrastructure/*.csproj src/RestauranteInteligente.Infrastructure/
COPY src/RestauranteInteligente.Api/*.csproj src/RestauranteInteligente.Api/

# Restauração das dependências NuGet
RUN dotnet restore src/RestauranteInteligente.Api/RestauranteInteligente.Api.csproj

# Copia o código fonte completo
COPY src/RestauranteInteligente.Domain/ src/RestauranteInteligente.Domain/
COPY src/RestauranteInteligente.Application/ src/RestauranteInteligente.Application/
COPY src/RestauranteInteligente.Infrastructure/ src/RestauranteInteligente.Infrastructure/
COPY src/RestauranteInteligente.Api/ src/RestauranteInteligente.Api/

# Compilação e publicação em modo Release
RUN dotnet publish src/RestauranteInteligente.Api/RestauranteInteligente.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ------------------------------------------------------------------------------
# Runtime Image (Alpine Linux minimalista e segura)
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime
WORKDIR /app

# Instala curl para healthcheck
RUN apk add --no-cache curl icu-libs

ENV ASPNETCORE_URLS=http://+:5000 \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    LC_ALL=en_US.UTF-8 \
    LANG=en_US.UTF-8

# Cria usuário não-privilegiado para execução segura
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/publish .

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/events/stream || exit 0

ENTRYPOINT ["dotnet", "RestauranteInteligente.Api.dll"]
