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

// Camada de Infraestrutura: Redis Resiliente, JWT, Blacklist, Rate Limiting e FallbackPolicy
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
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
