namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// Utilitário canônico para padronização de chaves Redis multi-tenant utilizando Hash Tags ({tenantId}).
/// Garante isolamento estrito e compatibilidade com Redis Cluster.
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
}
