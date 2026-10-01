using Microsoft.AspNetCore.HttpOverrides;
using RestauranteInteligente.Api.Middlewares;
using RestauranteInteligente.Application;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Services;
using RestauranteInteligente.Infrastructure;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Suporte a cabeçalhos de proxy reverso (ngrok / reverse proxy)
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

    // Configuração de Controladores e OpenAPI com suporte a caracteres UTF-8 relaxados
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        });
    builder.Services.AddOpenApi();

    // Configuração de CORS: Permite conexões do Expo Web (localhost) e clientes web com suporte a credenciais e cabeçalhos customizados
    builder.Services.AddCors(options =>
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

    // Camada de Aplicação: Contexto de Tenant escopado e Use Cases
    builder.Services.AddScoped<ITenantContext, TenantContext>();
    builder.Services.AddApplicationServices();

    // Camada de Infraestrutura: Redis Resiliente, JWT, Blacklist, Rate Limiting, FallbackPolicy e PostgreSQL EF Core
    builder.Services.AddInfrastructureServices(builder.Configuration);

    var app = builder.Build();

    app.UseForwardedHeaders();

    // 0. Tratamento Global de Falhas (RFC 7807 Problem Details com CorrelationId)
    app.UseMiddleware<ExceptionMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi().AllowAnonymous();
    }

    // 1. Roteamento de Endpoints mandatário antes da avaliação de CORS
    app.UseRouting();

    // 2. CORS avaliado imediatamente após o roteamento para interceptar e autorizar requisições preflight (OPTIONS)
    app.UseCors();

    // 3. Autenticação JWT (Valida assinatura e checa Blacklist no Redis)
    app.UseAuthentication();

    // 4. Resolução Soberana de Tenant (Claim JWT ou X-Tenant-Id autenticado por X-API-Key)
    app.UseMiddleware<TenantMiddleware>();

    // 5. Autorização baseada em Roles, Policies e TenantContext (Deny-by-Default)
    app.UseAuthorization();

    // 6. Rate Limiting Distribuído (Sliding Window via Script Lua no Redis)
    app.UseMiddleware<RateLimitingMiddleware>();

    // Endpoint de Health Check leve para sondagem de conectividade do frontend e orquestradores
    app.MapGet("/api/v1/health", () => Results.Ok(new { status = "healthy", timestamp = DateTimeOffset.UtcNow }))
       .AllowAnonymous();

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.Error.WriteLine();
    Console.Error.WriteLine("================================================================================");
    Console.Error.WriteLine("[FATAL STARTUP EXCEPTION] Falha crítica durante o bootstrap/inicialização da API:");
    Console.Error.WriteLine($"Tipo da Exceção : {ex.GetType().FullName}");
    Console.Error.WriteLine($"Mensagem        : {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.Error.WriteLine($"Causa Interna   : {ex.InnerException.GetType().FullName}: {ex.InnerException.Message}");
    }
    Console.Error.WriteLine("--------------------------------------------------------------------------------");
    Console.Error.WriteLine("Stack Trace:");
    Console.Error.WriteLine(ex.ToString());
    Console.Error.WriteLine("================================================================================");
    Console.Error.WriteLine();
    Console.ResetColor();

    throw;
}
