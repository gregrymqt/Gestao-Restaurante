using RestauranteInteligente.Api.Middlewares;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Services;
using RestauranteInteligente.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Configuração de Controladores e OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Camada de Aplicação: Contexto de Tenant escopado
builder.Services.AddScoped<ITenantContext, TenantContext>();

// Camada de Infraestrutura: Redis Resiliente (SafeCache, Idempotência, Distributed Lock, SSE Stream)
builder.Services.AddRedisInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Registro do Middleware de Multi-Tenancy
app.UseMiddleware<TenantMiddleware>();

app.MapControllers();

app.Run();
