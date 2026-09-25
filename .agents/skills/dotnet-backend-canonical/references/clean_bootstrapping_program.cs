// ==============================================================================
// Manual Canónico de Backend: ASP.NET Core (.NET 9 / C# 13)
// Inicialização Canônica da Aplicação (Clean Bootstrapping Pattern)
// ==============================================================================

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RestauranteInteligente.Api.Extensions;
using RestauranteInteligente.Api.Middlewares;
using RestauranteInteligente.Application;
using RestauranteInteligente.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração padronizada de Logging Estruturado (Serilog)
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// 2. Composição Modular e Injeção de Dependências por Camadas
builder.Services
    .AddApplicationServices()
    .AddInfrastructureServices(builder.Configuration)
    .AddApiServices(builder.Configuration);

var app = builder.Build();

// 3. Pipeline de Execução de Middlewares HTTP
// Middleware de Exceção Global posicionado no topo para capturar qualquer falha da esteira
app.UseMiddleware<ExceptionMiddleware>();

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

// 4. Autenticação e Contexto Multi-Tenant
app.UseAuthentication();
app.UseMiddleware<TenantContextMiddleware>();
app.UseAuthorization();

// 5. Mapeamento de Controladores e Verificadores de Integridade Operacional (Health Checks)
app.MapControllers();
app.MapCustomHealthChecks();

app.Run();
