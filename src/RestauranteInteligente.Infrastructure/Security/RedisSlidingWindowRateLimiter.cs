using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Rate Limiter distribuído de alta precisão implementado via algoritmo Sliding Window
/// executado atomicamente através de script Lua sobre Sorted Sets no Redis.
/// </summary>
public sealed class RedisSlidingWindowRateLimiter : IRateLimiterService
{
    private const string SlidingWindowLuaScript = @"
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local clearBefore = now - window

        -- Remove entradas anteriores à janela deslizante
        redis.call('zremrangebyscore', key, '-inf', clearBefore)

        -- Quantidade de requisições na janela atual
        local current = redis.call('zcard', key)

        if current < limit then
            local uniqueMember = now .. '-' .. math.random(1000, 9999)
            redis.call('zadd', key, now, uniqueMember)
            redis.call('pexpire', key, window)
            return { 1, current + 1, 0 }
        else
            -- Obtém a pontuação do registro mais antigo para calcular o tempo até liberar a cota
            local oldest = redis.call('zrange', key, 0, 0, 'WITHSCORES')
            local retryAfterMs = 1000
            if #oldest >= 2 then
                local oldestScore = tonumber(oldest[2])
                retryAfterMs = math.max(1, (oldestScore + window) - now)
            end
            return { 0, current, retryAfterMs }
        end
    ";

    private readonly IRedisConnectionFactory _connectionFactory;
    private readonly ILogger<RedisSlidingWindowRateLimiter> _logger;

    public RedisSlidingWindowRateLimiter(
        IRedisConnectionFactory connectionFactory,
        ILogger<RedisSlidingWindowRateLimiter> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task<RateLimitResult> CheckRateLimitAsync(
        string clientKey,
        long maxRequests,
        TimeSpan window,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(clientKey))
            throw new ArgumentException("Chave do cliente não pode ser vazia.", nameof(clientKey));

        ct.ThrowIfCancellationRequested();

        var db = _connectionFactory.GetDatabase();
        var fullKey = RedisKeyHelper.BuildRateLimitKey(clientKey);

        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var windowMs = (long)window.TotalMilliseconds;

        try
        {
            var result = (RedisResult[]?)await db.ScriptEvaluateAsync(
                SlidingWindowLuaScript,
                keys: [ (RedisKey)fullKey ],
                values: [ (RedisValue)now, (RedisValue)windowMs, (RedisValue)maxRequests ],
                flags: CommandFlags.None
            );

            if (result != null && result.Length >= 3)
            {
                var isAllowed = (long)result[0] == 1;
                var currentCount = (long)result[1];
                var retryAfterMs = (long)result[2];

                if (!isAllowed)
                {
                    _logger.LogWarning(
                        "Rate limit excedido para '{ClientKey}'. Contagem: {Count}/{Limit}. Retry após {RetryAfter}ms.",
                        clientKey, currentCount, maxRequests, retryAfterMs);
                }

                return new RateLimitResult(
                    IsAllowed: isAllowed,
                    CurrentCount: currentCount,
                    Limit: maxRequests,
                    RetryAfter: TimeSpan.FromMilliseconds(retryAfterMs)
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao avaliar script de Rate Limiting no Redis para '{ClientKey}'. Permitindo requisição em modo fail-open moderado.", clientKey);
        }

        // Fallback em caso de indisponibilidade momentânea do Redis para não travar a API
        return new RateLimitResult(IsAllowed: true, CurrentCount: 1, Limit: maxRequests, RetryAfter: TimeSpan.Zero);
    }
}
