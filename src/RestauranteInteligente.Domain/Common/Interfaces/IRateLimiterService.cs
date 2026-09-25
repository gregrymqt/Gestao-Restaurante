namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Resultado da verificação de Rate Limiting.
/// </summary>
public sealed record RateLimitResult(
    bool IsAllowed,
    long CurrentCount,
    long Limit,
    TimeSpan RetryAfter
);

/// <summary>
/// Contrato canônico de limitação de taxa distribuída (Rate Limiting) baseada em Sliding Window.
/// </summary>
public interface IRateLimiterService
{
    /// <summary>
    /// Verifica e registra atômica e continuamente a taxa de requisições de um cliente.
    /// </summary>
    Task<RateLimitResult> CheckRateLimitAsync(
        string clientKey,
        long maxRequests,
        TimeSpan window,
        CancellationToken ct = default);
}
