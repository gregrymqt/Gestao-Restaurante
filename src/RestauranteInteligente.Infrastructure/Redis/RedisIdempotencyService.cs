using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// Implementação de idempotência distribuída no Redis utilizando operações atômicas SET NX EX.
/// </summary>
public sealed class RedisIdempotencyService : IIdempotencyService
{
    private const string StateProcessing = "PROCESSING";
    private const string StateCompleted = "COMPLETED";

    private readonly IRedisConnectionFactory _connectionFactory;
    private readonly ILogger<RedisIdempotencyService> _logger;

    public RedisIdempotencyService(
        IRedisConnectionFactory connectionFactory,
        ILogger<RedisIdempotencyService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task<bool> TryAcquireAsync(Guid tenantId, string operationKey, TimeSpan ttl, CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(operationKey)) throw new ArgumentException("Chave de operação não pode ser vazia.", nameof(operationKey));

        var db = _connectionFactory.GetDatabase();
        var fullKey = RedisKeyHelper.BuildIdempotencyKey(tenantId, operationKey);

        ct.ThrowIfCancellationRequested();

        // SET key PROCESSING NX EX ttl com flags explícitas
        var acquired = await db.StringSetAsync(fullKey, StateProcessing, ttl, When.NotExists, CommandFlags.None);

        if (acquired)
        {
            _logger.LogDebug("Idempotência adquirida com sucesso para chave '{Key}' por {TTL}.", fullKey, ttl);
            return true;
        }

        _logger.LogWarning("Operação duplicada detectada no Redis para chave '{Key}'. Ignorando processamento redundante.", fullKey);
        return false;
    }

    public async Task MarkCompletedAsync(Guid tenantId, string operationKey, TimeSpan retentionTtl, CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(operationKey)) throw new ArgumentException("Chave de operação não pode ser vazia.", nameof(operationKey));

        var db = _connectionFactory.GetDatabase();
        var fullKey = RedisKeyHelper.BuildIdempotencyKey(tenantId, operationKey);

        ct.ThrowIfCancellationRequested();

        await db.StringSetAsync(fullKey, StateCompleted, retentionTtl, When.Always, CommandFlags.None);
        _logger.LogDebug("Operação '{Key}' marcada como concluída no Redis com retenção de {TTL}.", fullKey, retentionTtl);
    }

    public async Task ReleaseAsync(Guid tenantId, string operationKey, CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(operationKey)) throw new ArgumentException("Chave de operação não pode ser vazia.", nameof(operationKey));

        var db = _connectionFactory.GetDatabase();
        var fullKey = RedisKeyHelper.BuildIdempotencyKey(tenantId, operationKey);

        ct.ThrowIfCancellationRequested();

        await db.KeyDeleteAsync(fullKey, CommandFlags.None);
        _logger.LogDebug("Chave de idempotência '{Key}' liberada para reprocessamento.", fullKey);
    }
}
