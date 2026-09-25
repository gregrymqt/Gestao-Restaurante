using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Serviço de revogação de tokens JWT (Blacklist) persistido no Redis.
/// Utiliza chaves com TTL automático atrelado ao tempo de vida remanescente do token.
/// </summary>
public sealed class RedisTokenBlacklistService : ITokenBlacklistService
{
    private const string RevokedValue = "REVOKED";

    private readonly IRedisConnectionFactory _connectionFactory;
    private readonly ILogger<RedisTokenBlacklistService> _logger;

    public RedisTokenBlacklistService(
        IRedisConnectionFactory connectionFactory,
        ILogger<RedisTokenBlacklistService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task RevokeTokenAsync(string jti, TimeSpan remainingTtl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
            throw new ArgumentException("JTI do token não pode ser vazio.", nameof(jti));

        if (remainingTtl <= TimeSpan.Zero)
        {
            _logger.LogDebug("Token '{Jti}' já expirou. Inclusão na blacklist dispensada.", jti);
            return;
        }

        ct.ThrowIfCancellationRequested();

        var db = _connectionFactory.GetDatabase();
        var key = RedisKeyHelper.BuildBlacklistKey(jti);

        await db.StringSetAsync(key, RevokedValue, remainingTtl, When.Always, CommandFlags.None);
        _logger.LogInformation("Token '{Jti}' inserido na Blacklist do Redis com expiração em {RemainingTTL}.", jti, remainingTtl);
    }

    public async Task<bool> IsTokenRevokedAsync(string jti, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
            return false;

        ct.ThrowIfCancellationRequested();

        var db = _connectionFactory.GetDatabase();
        var key = RedisKeyHelper.BuildBlacklistKey(jti);

        var isRevoked = await db.KeyExistsAsync(key, CommandFlags.None);
        if (isRevoked)
        {
            _logger.LogWarning("Tentativa de acesso com token revogado na Blacklist detectada para JTI '{Jti}'.", jti);
        }

        return isRevoked;
    }
}
