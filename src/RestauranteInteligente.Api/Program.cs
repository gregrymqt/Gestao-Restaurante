using RestauranteInteligente.Api.Extensions;
using RestauranteInteligente.Application;
using RestauranteInteligente.Infrastructure;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // 1. Injeção de Dependências Segregada por Camadas (SRP)
    builder.Services.AddApiServices();
    builder.Services.AddApplicationServices();
    builder.Services.AddInfrastructureServices(builder.Configuration);

    var app = builder.Build();

    // 2. Encadeamento do Pipeline HTTP e Middlewares
    app.UseApiPipeline();

    // 3. Documentação Interativa da API (OpenAPI 3.0 / Swagger UI / Scalar)
    app.MapApiDocumentation();

    // 4. Endpoints Operacionais e Controladores
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
