using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Api.Middlewares;

/// <summary>
/// Middleware de extração e injeção do TenantId da requisição no TenantContext escopado.
/// </summary>
public sealed class TenantMiddleware
{
    public const string TenantHeaderName = "X-Tenant-Id";
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        if (context.Request.Headers.TryGetValue(TenantHeaderName, out var headerValue) &&
            Guid.TryParse(headerValue.FirstOrDefault(), out var tenantId))
        {
            tenantContext.SetTenantId(tenantId);
        }

        await _next(context);
    }
}
