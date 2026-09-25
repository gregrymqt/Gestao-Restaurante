using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Api.Middlewares;

/// <summary>
/// Middleware de Rate Limiting distribuído com suporte a cotas anônimas (por IP) e autenticadas (por Tenant/User).
/// Emite respostas no padrão RFC 7807 (429 Too Many Requests) e cabeçalhos X-RateLimit.
/// </summary>
public sealed class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IRateLimiterService rateLimiter)
    {
        var (clientKey, maxRequests, window) = ResolveRateLimitPolicy(context);

        var result = await rateLimiter.CheckRateLimitAsync(clientKey, maxRequests, window, context.RequestAborted);

        // Adiciona cabeçalhos informativos na resposta HTTP
        context.Response.Headers["X-RateLimit-Limit"] = result.Limit.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, result.Limit - result.CurrentCount).ToString();

        if (!result.IsAllowed)
        {
            var retryAfterSec = Math.Max(1, (int)Math.Ceiling(result.RetryAfter.TotalSeconds));
            context.Response.Headers["Retry-After"] = retryAfterSec.ToString();
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.ContentType = "application/problem+json";

            var problemDetails = new ProblemDetails
            {
                Type = "https://datatracker.ietf.org/doc/html/rfc6585#section-4",
                Title = "Limite de Requisições Excedido",
                Status = StatusCodes.Status429TooManyRequests,
                Detail = $"Você excedeu o limite máximo de {result.Limit} requisições. Tente novamente em {retryAfterSec} segundos.",
                Instance = context.Request.Path
            };
            problemDetails.Extensions["retryAfterSeconds"] = retryAfterSec;

            await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails), context.RequestAborted);
            return;
        }

        await _next(context);
    }

    private static (string ClientKey, long MaxRequests, TimeSpan Window) ResolveRateLimitPolicy(HttpContext context)
    {
        var window = TimeSpan.FromMinutes(1);

        // Cliente autenticado: cota por Tenant + Usuário
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                         ?? "unknown_user";

            var tenantId = context.User.FindFirst("restaurante_id")?.Value ?? "global";

            return ($"tenant:{{{tenantId}}}:user:{userId}", 120, window);
        }

        // Cliente anônimo: proteção reforçada em endpoints de autenticação
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip";
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        if (path.Contains("/api/v1/auth/login"))
        {
            return ($"anon:login:ip:{ip}", 10, window); // Limite estrito contra força bruta
        }

        return ($"anon:general:ip:{ip}", 60, window);
    }
}
