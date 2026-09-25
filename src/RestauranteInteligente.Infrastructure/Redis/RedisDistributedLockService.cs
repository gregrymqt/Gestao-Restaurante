using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// Implementação de Lock Distribuído resiliente no Redis utilizando token de posse (UUID)
/// e script Lua para liberação segura e atômica.
/// </summary>
public sealed class RedisDistributedLockService : IDistributedLockService
{
    private const string ReleaseLockLuaScript = @"
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end";

    private readonly IRedisConnectionFactory _connectionFactory;
    private readonly ILogger<RedisDistributedLockService> _logger;

    public RedisDistributedLockService(
        IRedisConnectionFactory connectionFactory,
        ILogger<RedisDistributedLockService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task<IAsyncDisposable?> TryAcquireLockAsync(
        Guid tenantId,
        string resourceKey,
        TimeSpan ttl,
        TimeSpan acquireTimeout,
        CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(resourceKey)) throw new ArgumentException("Chave do recurso não pode ser vazia.", nameof(resourceKey));

        var db = _connectionFactory.GetDatabase();
        var lockKey = RedisKeyHelper.BuildLockKey(tenantId, resourceKey);
        var lockToken = Guid.NewGuid().ToString("N");

        var startTime = DateTimeOffset.UtcNow;
        var retryDelay = TimeSpan.FromMilliseconds(50);

        while (!ct.IsCancellationRequested)
        {
            var acquired = await db.StringSetAsync(lockKey, lockToken, ttl, When.NotExists, CommandFlags.None);
            if (acquired)
            {
                _logger.LogDebug("Lock distribuído obtido para '{LockKey}' com token '{Token}'.", lockKey, lockToken);
                return new DistributedLockReleaser(db, lockKey, lockToken, _logger);
            }

            if (DateTimeOffset.UtcNow - startTime >= acquireTimeout)
            {
                _logger.LogWarning("Tempo de espera ({Timeout}ms) esgotado ao tentar adquirir lock para '{LockKey}'.", acquireTimeout.TotalMilliseconds, lockKey);
                return null;
            }

            // Jitter aleatório para mitigar concorrência em rebanho (thundering herd)
            var jitter = Random.Shared.Next(10, 40);
            await Task.Delay(retryDelay + TimeSpan.FromMilliseconds(jitter), ct);
        }

        return null;
    }

    private sealed class DistributedLockReleaser : IAsyncDisposable
    {
        private readonly IDatabase _database;
        private readonly string _lockKey;
        private readonly string _lockToken;
        private readonly ILogger _logger;
        private int _isReleased;

        public DistributedLockReleaser(
            IDatabase database,
            string lockKey,
            string lockToken,
            ILogger logger)
        {
            _database = database;
            _lockKey = lockKey;
            _lockToken = lockToken;
            _logger = logger;
        }

        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _isReleased, 1) != 0)
                return;

            try
            {
                var result = (long)await _database.ScriptEvaluateAsync(
                    ReleaseLockLuaScript,
                    keys: [ (RedisKey)_lockKey ],
                    values: [ (RedisValue)_lockToken ],
                    flags: CommandFlags.None
                );

                if (result == 1)
                {
                    _logger.LogDebug("Lock liberado com sucesso para '{LockKey}'.", _lockKey);
                }
                else
                {
                    _logger.LogWarning("Lock para '{LockKey}' já havia expirado ou pertence a outro detentor. Liberação ignorada.", _lockKey);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao executar script Lua de liberação de lock para '{LockKey}'.", _lockKey);
            }
        }
    }
}
