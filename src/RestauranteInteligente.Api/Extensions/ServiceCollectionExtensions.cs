using Microsoft.AspNetCore.HttpOverrides;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Services;

namespace RestauranteInteligente.Api.Extensions;

/// <summary>
/// Métodos de extensão para configuração e injeção de dependências da camada de API (Web).
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        // 1. Suporte a cabeçalhos de proxy reverso (ngrok / reverse proxy)
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();
        });

        // 2. Controladores com serialização JSON UTF-8 relaxada
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
            });

        // 3. Documentação OpenAPI nativa do .NET 9
        services.AddOpenApi();

        // 4. Configuração de CORS: Permite origens seguras (configuráveis via ALLOWED_CORS_ORIGINS ou localhost/dev)
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                var allowedOriginsEnv = Environment.GetEnvironmentVariable("ALLOWED_CORS_ORIGINS");
                if (!string.IsNullOrWhiteSpace(allowedOriginsEnv))
                {
                    var origins = allowedOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    policy.WithOrigins(origins)
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials()
                          .WithExposedHeaders("X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After");
                }
                else
                {
                    policy.SetIsOriginAllowed(origin =>
                    {
                        if (string.IsNullOrWhiteSpace(origin)) return false;
                        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                        return uri.Host is "localhost" or "127.0.0.1" || uri.Host.EndsWith(".local");
                    })
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials()
                    .WithExposedHeaders("X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After");
                }
            });
        });

        // 5. Contexto de Tenant escopado para requisições HTTP
        services.AddScoped<ITenantContext, TenantContext>();

        return services;
    }
}
