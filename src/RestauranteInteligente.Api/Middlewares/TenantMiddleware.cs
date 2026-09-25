using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Security;

namespace RestauranteInteligente.Api.Middlewares;

/// <summary>
/// Middleware de segurança e contexto multi-tenant.
/// Implementa proteção estrita anti-tenant-spoofing:
/// 1. Em requisições autenticadas, a claim 'restaurante_id' do token JWT é soberana.
///    Caso o cabeçalho 'X-Tenant-Id' seja enviado com valor divergente da claim, a requisição é sumariamente abortada com status 403 Forbidden.
/// 2. Em requisições de serviço (sem JWT) que informam 'X-Tenant-Id', a autenticação via 'X-API-Key' é obrigatória.
///    Chamadores anônimos sem credencial válida são bloqueados com status 401 Unauthorized.
/// </summary>
public sealed class TenantMiddleware
{
    public const string TenantHeaderName = "X-Tenant-Id";
    public const string ApiKeyHeaderName = "X-API-Key";

    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;
    private readonly SecurityOptions _securityOptions;

    public TenantMiddleware(
        RequestDelegate next,
        ILogger<TenantMiddleware> logger,
        IOptions<SecurityOptions>? securityOptions = null)
    {
        _next = next;
        _logger = logger;
        _securityOptions = securityOptions?.Value ?? new SecurityOptions();
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        // 1. Usuário autenticado via JWT
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var claimTenant = context.User.FindFirst("restaurante_id")?.Value;
            if (string.IsNullOrWhiteSpace(claimTenant) || !Guid.TryParse(claimTenant, out var jwtTenantId))
            {
                _logger.LogWarning("Token JWT autenticado não possui claim 'restaurante_id' válida.");
                await WriteProblemDetailsResponseAsync(
                    context,
                    status: StatusCodes.Status403Forbidden,
                    title: "Inquilino Ausente no Token",
                    detail: "O token JWT autenticado não contém uma claim 'restaurante_id' válida para identificação do inquilino.");
                return;
            }

            // Valida divergência com o cabeçalho X-Tenant-Id (Anti-Tenant-Spoofing / Anti-BOLA)
            if (context.Request.Headers.TryGetValue(TenantHeaderName, out var headerValue) &&
                Guid.TryParse(headerValue.FirstOrDefault(), out var headerTenantId))
            {
                if (jwtTenantId != headerTenantId)
                {
                    _logger.LogCritical(
                        "VIOLAÇÃO DE SEGURANÇA: Tentativa de Tenant Spoofing detectada! Token pertence ao restaurante {JwtTenant}, mas a requisição forjou o cabeçalho {HeaderTenant}.",
                        jwtTenantId, headerTenantId);

                    await WriteProblemDetailsResponseAsync(
                        context,
                        status: StatusCodes.Status403Forbidden,
                        title: "Tenant Spoofing Rejeitado",
                        detail: "O restaurante informado no cabeçalho X-Tenant-Id diverge do restaurante autorizado no token JWT criptografado.");
                    return;
                }
            }

            // Injeta o inquilino legítimo autenticado no contexto
            tenantContext.SetTenantId(jwtTenantId);
        }
        // 2. Chamadas de serviço/integração que enviam X-Tenant-Id sem JWT
        else if (context.Request.Headers.TryGetValue(TenantHeaderName, out var headerValue) &&
                 Guid.TryParse(headerValue.FirstOrDefault(), out var headerTenantId))
        {
            // Exigência estrita de autenticação de serviço via X-API-Key
            if (!IsValidServiceApiKey(context))
            {
                _logger.LogWarning(
                    "Tentativa de injeção de TenantId anônimo bloqueada: requisição forneceu '{TenantHeader}' sem uma chave de serviço 'X-API-Key' válida.",
                    TenantHeaderName);

                await WriteProblemDetailsResponseAsync(
                    context,
                    status: StatusCodes.Status401Unauthorized,
                    title: "Autenticação de Serviço Requerida",
                    detail: "O uso do cabeçalho X-Tenant-Id em chamadas sem token JWT requer autenticação por chave de serviço válida (X-API-Key).");
                return;
            }

            tenantContext.SetTenantId(headerTenantId);
        }

        await _next(context);
    }

    private bool IsValidServiceApiKey(HttpContext context)
    {
        if (string.IsNullOrWhiteSpace(_securityOptions.InternalServiceApiKey))
            return false;

        if (!context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var receivedApiKey) ||
            string.IsNullOrWhiteSpace(receivedApiKey.FirstOrDefault()))
        {
            return false;
        }

        var expectedBytes = Encoding.UTF8.GetBytes(_securityOptions.InternalServiceApiKey);
        var actualBytes = Encoding.UTF8.GetBytes(receivedApiKey.FirstOrDefault()!);

        if (expectedBytes.Length != actualBytes.Length)
            return false;

        return CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }

    private static async Task WriteProblemDetailsResponseAsync(HttpContext context, int status, string title, string detail)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Type = $"https://datatracker.ietf.org/doc/html/rfc7231#section-{(status == 403 ? "6.5.3" : "6.5.1")}",
            Title = title,
            Status = status,
            Detail = detail,
            Instance = context.Request.Path
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails), context.RequestAborted);
    }
}