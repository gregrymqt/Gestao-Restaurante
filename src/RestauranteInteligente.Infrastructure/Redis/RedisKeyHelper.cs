namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// Utilitário canônico para padronização de chaves Redis multi-tenant utilizando Hash Tags ({tenantId})
/// e chaves globais de segurança (Blacklist, Rate Limiting e Refresh Tokens).
/// </summary>
public static class RedisKeyHelper
{
    public static string BuildIdempotencyKey(Guid tenantId, string operationKey)
        => $"{{{tenantId}}}:idempotency:{operationKey.Trim()}";

    public static string BuildLockKey(Guid tenantId, string resourceKey)
        => $"{{{tenantId}}}:lock:{resourceKey.Trim()}";

    public static string BuildCacheKey(Guid tenantId, string cacheKey)
        => $"{{{tenantId}}}:cache:{cacheKey.Trim()}";

    public static string BuildTenantStreamChannel(Guid tenantId)
        => $"{{{tenantId}}}:events:stream";

    public static string BuildBlacklistKey(string jti)
        => $"blacklist:jti:{jti.Trim()}";

    public static string BuildRateLimitKey(string clientKey)
        => $"ratelimit:{clientKey.Trim()}";

    public static string BuildRefreshTokenKey(string tokenHash)
        => $"refreshtoken:{tokenHash.Trim()}";

    public static string BuildTokenFamilyKey(string familyId)
        => $"tokenfamily:{familyId.Trim()}";
}
