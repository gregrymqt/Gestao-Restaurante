using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Api.Middlewares;

/// <summary>
/// Middleware de segurança e contexto multi-tenant.
/// Implementa proteção estrita anti-tenant-spoofing: em requisições autenticadas,
/// a claim 'restaurante_id' do token JWT é soberana. Caso o cabeçalho 'X-Tenant-Id' seja enviado
/// com valor divergente da claim, a requisição é sumariamente abortada com status 403 Forbidden.
/// </summary>
public sealed class TenantMiddleware
{
    public const string TenantHeaderName = "X-Tenant-Id";
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        // 1. Usuário autenticado via JWT
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var claimTenant = context.User.FindFirst("restaurante_id")?.Value;
            if (!string.IsNullOrWhiteSpace(claimTenant) && Guid.TryParse(claimTenant, out var jwtTenantId))
            {
                // Valida divergência com o cabeçalho X-Tenant-Id (Anti-Tenant-Spoofing / Anti-BOLA)
                if (context.Request.Headers.TryGetValue(TenantHeaderName, out var headerValue) &&
                    Guid.TryParse(headerValue.FirstOrDefault(), out var headerTenantId))
                {
                    if (jwtTenantId != headerTenantId)
                    {
                        _logger.LogCritical(
                            "VIOLAÇÃO DE SEGURANÇA: Tentativa de Tenant Spoofing detectada! Token pertence ao restaurante {JwtTenant}, mas a requisição forjou o cabeçalho {HeaderTenant}.",
                            jwtTenantId, headerTenantId);

                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/problem+json";

                        var problemDetails = new ProblemDetails
                        {
                            Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.3",
                            Title = "Tenant Spoofing Rejeitado",
                            Status = StatusCodes.Status403Forbidden,
                            Detail = "O restaurante informado no cabeçalho X-Tenant-Id diverge do restaurante autorizado no token JWT criptografado.",
                            Instance = context.Request.Path
                        };

                        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails), context.RequestAborted);
                        return;
                    }
                }

                // Injeta o inquilino legítimo autenticado no contexto
                tenantContext.SetTenantId(jwtTenantId);
            }
        }
        // 2. Usuário anônimo / Rotas públicas de integração
        else if (context.Request.Headers.TryGetValue(TenantHeaderName, out var headerValue) &&
                 Guid.TryParse(headerValue.FirstOrDefault(), out var headerTenantId))
        {
            tenantContext.SetTenantId(headerTenantId);
        }

        await _next(context);
    }
}