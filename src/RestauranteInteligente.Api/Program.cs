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

// Camada de Infraestrutura: Redis Resiliente, JWT, Blacklist e Rate Limiting
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// 1. Autenticação JWT (Valida assinatura e checa Blacklist no Redis via OnTokenValidated)
app.UseAuthentication();

// 2. Autorização baseada em Roles e Policies
app.UseAuthorization();

// 3. Rate Limiting Distribuído (Sliding Window via Script Lua no Redis)
app.UseMiddleware<RateLimitingMiddleware>();

// 4. Registro do Middleware de Multi-Tenancy (Claim restaurante_id do JWT ou X-Tenant-Id)
app.UseMiddleware<TenantMiddleware>();

app.MapControllers();

app.Run();
