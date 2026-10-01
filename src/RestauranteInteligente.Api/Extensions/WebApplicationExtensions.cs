using RestauranteInteligente.Api.Middlewares;

namespace RestauranteInteligente.Api.Extensions;

/// <summary>
/// Métodos de extensão para configuração de pipeline de middlewares e rotas de documentação da API.
/// </summary>
public static class WebApplicationExtensions
{
    /// <summary>
    /// Configura a ordem canônica do pipeline de middlewares HTTP.
    /// </summary>
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        // 0. Suporte a cabeçalhos de proxy reverso
        app.UseForwardedHeaders();

        // 1. Tratamento Global de Falhas (RFC 7807 Problem Details com CorrelationId)
        app.UseMiddleware<ExceptionMiddleware>();

        // 2. Roteamento de Endpoints
        app.UseRouting();

        // 3. CORS avaliado imediatamente após o roteamento para tratar preflight (OPTIONS)
        app.UseCors();

        // 4. Autenticação JWT (Valida assinatura e checa Blacklist no Redis)
        app.UseAuthentication();

        // 5. Resolução Soberana de Tenant (Claim JWT ou X-Tenant-Id autenticado por X-API-Key)
        app.UseMiddleware<TenantMiddleware>();

        // 6. Autorização baseada em Roles, Policies e TenantContext (Deny-by-Default)
        app.UseAuthorization();

        // 7. Rate Limiting Distribuído (Sliding Window via Script Lua no Redis)
        app.UseMiddleware<RateLimitingMiddleware>();

        return app;
    }

    /// <summary>
    /// Registra os endpoints de documentação OpenAPI, Swagger UI e Scalar em ambiente de desenvolvimento.
    /// </summary>
    public static WebApplication MapApiDocumentation(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return app;
        }

        // Endpoint formal da especificação OpenAPI 3.0 em JSON
        app.MapOpenApi().AllowAnonymous();

        // 1. Swagger UI Clássico (OpenAPI 3.0 via Swagger-UI CDN com presets completos)
        app.MapGet("/swagger", () => Results.Content(
            """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Restaurante Inteligente - Swagger UI</title>
              <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
              <style>
                body { margin: 0; background: #fafafa; }
                .topbar { display: none; }
              </style>
            </head>
            <body>
              <div id="swagger-ui"></div>
              <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
              <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
              <script>
                window.onload = function() {
                  window.ui = SwaggerUIBundle({
                    url: '/openapi/v1.json',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                      SwaggerUIBundle.presets.apis,
                      SwaggerUIStandalonePreset
                    ],
                    layout: 'BaseLayout'
                  });
                };
              </script>
            </body>
            </html>
            """,
            "text/html"
        )).AllowAnonymous();

        // 2. Scalar Modern API Reference (Padrão Oficial do .NET 9)
        app.MapGet("/docs", () => Results.Content(
            """
            <!doctype html>
            <html lang="pt-BR">
              <head>
                <title>Restaurante Inteligente - API Docs</title>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
              </head>
              <body>
                <script id="api-reference" data-url="/openapi/v1.json"></script>
                <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
              </body>
            </html>
            """,
            "text/html"
        )).AllowAnonymous();

        return app;
    }
}
