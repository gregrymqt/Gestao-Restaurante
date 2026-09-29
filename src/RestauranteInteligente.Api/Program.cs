using RestauranteInteligente.Api.Middlewares;
using RestauranteInteligente.Application;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Services;
using RestauranteInteligente.Infrastructure;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Configuração de Controladores e OpenAPI
    builder.Services.AddControllers();
    builder.Services.AddOpenApi();

    // Camada de Aplicação: Contexto de Tenant escopado e Use Cases
    builder.Services.AddScoped<ITenantContext, TenantContext>();
    builder.Services.AddApplicationServices();

    // Camada de Infraestrutura: Redis Resiliente, JWT, Blacklist, Rate Limiting, FallbackPolicy e PostgreSQL EF Core
    builder.Services.AddInfrastructureServices(builder.Configuration);

    var app = builder.Build();

    // 0. Tratamento Global de Falhas (RFC 7807 Problem Details com CorrelationId)
    app.UseMiddleware<ExceptionMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi().AllowAnonymous();
    }

    app.UseHttpsRedirection();

    // 1. Autenticação JWT (Valida assinatura e checa Blacklist no Redis)
    app.UseAuthentication();

    // 2. Resolução Soberana de Tenant (Claim JWT ou X-Tenant-Id autenticado por X-API-Key)
    app.UseMiddleware<TenantMiddleware>();

    // 3. Autorização baseada em Roles, Policies e TenantContext (Deny-by-Default)
    app.UseAuthorization();

    // 4. Rate Limiting Distribuído (Sliding Window via Script Lua no Redis)
    app.UseMiddleware<RateLimitingMiddleware>();

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
