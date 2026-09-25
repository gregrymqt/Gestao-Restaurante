using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Serviço de persistência, rotação e proteção de Refresh Tokens baseado em Token Families no Redis.
/// Detecta automaticamente replay attacks / roubo de tokens, invalidando a sessão inteira.
/// </summary>
public sealed class RedisRefreshTokenService : IRefreshTokenService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly IRedisConnectionFactory _connectionFactory;
    private readonly JwtOptions _jwtOptions;
    private readonly ILogger<RedisRefreshTokenService> _logger;

    public RedisRefreshTokenService(
        IRedisConnectionFactory connectionFactory,
        IOptions<JwtOptions> jwtOptions,
        ILogger<RedisRefreshTokenService> logger)
    {
        _connectionFactory = connectionFactory;
        _jwtOptions = jwtOptions.Value;
        _logger = logger;
    }

    public async Task<string> CreateRefreshTokenAsync(
        Guid userId,
        Guid restauranteId,
        string? familyId = null,
        TimeSpan? ttl = null,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        var tokenBytes = RandomNumberGenerator.GetBytes(64);
        var tokenString = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var tokenHash = ComputeHash(tokenString);
        var effectiveFamilyId = string.IsNullOrWhiteSpace(familyId) ? Guid.NewGuid().ToString("N") : familyId;
        var effectiveTtl = ttl ?? TimeSpan.FromDays(_jwtOptions.RefreshTokenExpirationDays);
        var expiresAt = DateTimeOffset.UtcNow.Add(effectiveTtl);

        var session = new RefreshTokenSession(
            TokenHash: tokenHash,
            UserId: userId,
            RestauranteId: restauranteId,
            FamilyId: effectiveFamilyId,
            ExpiresAt: expiresAt,
            IsUsed: false
        );

        var db = _connectionFactory.GetDatabase();
        var tokenKey = RedisKeyHelper.BuildRefreshTokenKey(tokenHash);
        var familyKey = RedisKeyHelper.BuildTokenFamilyKey(effectiveFamilyId);

        var serializedSession = JsonSerializer.Serialize(session, JsonOptions);

        await db.StringSetAsync(tokenKey, serializedSession, effectiveTtl, When.Always, CommandFlags.None);
        await db.SetAddAsync(familyKey, tokenHash, CommandFlags.None);
        await db.KeyExpireAsync(familyKey, effectiveTtl, CommandFlags.None);

        _logger.LogDebug("Refresh token criado com sucesso para família '{FamilyId}' (UserId: {UserId}).", effectiveFamilyId, userId);
        return tokenString;
    }

    public async Task<(bool Success, Guid UserId, Guid RestauranteId, string FamilyId)> RotateRefreshTokenAsync(
        string token,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            return (false, Guid.Empty, Guid.Empty, string.Empty);

        ct.ThrowIfCancellationRequested();

        var db = _connectionFactory.GetDatabase();
        var tokenHash = ComputeHash(token);
        var tokenKey = RedisKeyHelper.BuildRefreshTokenKey(tokenHash);

        var rawSession = await db.StringGetAsync(tokenKey, CommandFlags.None);
        if (rawSession.IsNullOrEmpty)
        {
            _logger.LogWarning("Tentativa de rotação com Refresh Token inexistente ou expirado.");
            return (false, Guid.Empty, Guid.Empty, string.Empty);
        }

        RefreshTokenSession? session;
        try
        {
            session = JsonSerializer.Deserialize<RefreshTokenSession>(rawSession.ToString(), JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao desserializar sessão de Refresh Token para hash '{TokenHash}'.", tokenHash);
            return (false, Guid.Empty, Guid.Empty, string.Empty);
        }

        if (session is null)
            return (false, Guid.Empty, Guid.Empty, string.Empty);

        // DETECÇÃO DE ROUBO DE REFRESH TOKEN (REPLAY ATTACK)
        if (session.IsUsed)
        {
            _logger.LogCritical("ALERTA DE SEGURANÇA: Reúso de Refresh Token detectado na família '{FamilyId}'! Revogando todas as sessões ativas.", session.FamilyId);
            await InvalidateFamilyAsync(session.FamilyId, ct);
            return (false, Guid.Empty, Guid.Empty, session.FamilyId);
        }

        // Marca o token atual como consumido com período curto de retenção de 2 minutos para absorver retentativas de rede
        var consumedSession = session with { IsUsed = true };
        await db.StringSetAsync(tokenKey, JsonSerializer.Serialize(consumedSession, JsonOptions), TimeSpan.FromMinutes(2), When.Always, CommandFlags.None);

        _logger.LogInformation("Refresh token rotacionado com sucesso para usuário {UserId} na família '{FamilyId}'.", session.UserId, session.FamilyId);
        return (true, session.UserId, session.RestauranteId, session.FamilyId);
    }

    public async Task InvalidateFamilyAsync(string familyId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(familyId))
            return;

        ct.ThrowIfCancellationRequested();

        var db = _connectionFactory.GetDatabase();
        var familyKey = RedisKeyHelper.BuildTokenFamilyKey(familyId);

        var hashes = await db.SetMembersAsync(familyKey, CommandFlags.None);
        foreach (var hash in hashes)
        {
            if (!hash.IsNullOrEmpty)
            {
                var tokenKey = RedisKeyHelper.BuildRefreshTokenKey(hash.ToString());
                await db.KeyDeleteAsync(tokenKey, CommandFlags.None);
            }
        }

        await db.KeyDeleteAsync(familyKey, CommandFlags.None);
        _logger.LogWarning("Família de tokens '{FamilyId}' completamente invalidada no Redis.", familyId);
    }

    private static string ComputeHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input.Trim()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
