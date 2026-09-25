using System.Text.Json;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// SafeCache multi-tenant implementado sobre o Redis.
/// Assegura isolamento rígido entre restaurantes por hash tags.
/// </summary>
public sealed class RedisCacheService : ICacheService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IRedisConnectionFactory _connectionFactory;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(
        IRedisConnectionFactory connectionFactory,
        ILogger<RedisCacheService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(Guid tenantId, string key, CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(key)) throw new ArgumentException("Chave não pode ser vazia.", nameof(key));

        ct.ThrowIfCancellationRequested();

        var db = _connectionFactory.GetDatabase();
        var cacheKey = RedisKeyHelper.BuildCacheKey(tenantId, key);

        var value = await db.StringGetAsync(cacheKey, CommandFlags.None);
        if (value.IsNullOrEmpty)
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(value.ToString(), JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao desserializar valor do cache para chave '{CacheKey}'.", cacheKey);
            return default;
        }
    }

    public async Task SetAsync<T>(Guid tenantId, string key, T value, TimeSpan ttl, CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(key)) throw new ArgumentException("Chave não pode ser vazia.", nameof(key));
        if (value is null) return;

        ct.ThrowIfCancellationRequested();

        var db = _connectionFactory.GetDatabase();
        var cacheKey = RedisKeyHelper.BuildCacheKey(tenantId, key);
        var serialized = JsonSerializer.Serialize(value, JsonOptions);

        await db.StringSetAsync(cacheKey, serialized, ttl, When.Always, CommandFlags.None);
        _logger.LogDebug("Cache armazenado com sucesso para chave '{CacheKey}' por {TTL}.", cacheKey, ttl);
    }

    public async Task RemoveAsync(Guid tenantId, string key, CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(key)) throw new ArgumentException("Chave não pode ser vazia.", nameof(key));

        ct.ThrowIfCancellationRequested();

        var db = _connectionFactory.GetDatabase();
        var cacheKey = RedisKeyHelper.BuildCacheKey(tenantId, key);

        await db.KeyDeleteAsync(cacheKey, CommandFlags.None);
        _logger.LogDebug("Cache removido para chave '{CacheKey}'.", cacheKey);
    }
}
