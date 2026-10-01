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

        // 4. Configuração de CORS: Permite conexões do Expo Web e clientes com credenciais
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.SetIsOriginAllowed(_ => true)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials()
                      .WithExposedHeaders("X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After");
            });
        });

        // 5. Contexto de Tenant escopado para requisições HTTP
        services.AddScoped<ITenantContext, TenantContext>();

        return services;
    }
}
