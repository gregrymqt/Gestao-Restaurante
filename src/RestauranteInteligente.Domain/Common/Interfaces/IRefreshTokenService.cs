namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Sessão e metadados de controle de um Refresh Token rastreado por família no Redis.
/// </summary>
public sealed record RefreshTokenSession(
    string TokenHash,
    Guid UserId,
    Guid RestauranteId,
    string FamilyId,
    DateTimeOffset ExpiresAt,
    bool IsUsed
);

/// <summary>
/// Contrato canônico para gerenciamento, rotação atômica e proteção de Refresh Tokens (Token Family).
/// </summary>
public interface IRefreshTokenService
{
    /// <summary>
    /// Gera e persiste um novo Refresh Token associado a uma família de tokens.
    /// </summary>
    Task<string> CreateRefreshTokenAsync(
        Guid userId,
        Guid restauranteId,
        string? familyId = null,
        TimeSpan? ttl = null,
        CancellationToken ct = default);

    /// <summary>
    /// Realiza a rotação atômica: consome o token atual e gera um novo par para a mesma família.
    /// Caso detecte reúso de um token já consumido (tentativa de replay/roubo), revoga imediatamente toda a família.
    /// </summary>
    Task<(bool Success, Guid UserId, Guid RestauranteId, string FamilyId)> RotateRefreshTokenAsync(
        string token,
        CancellationToken ct = default);

    /// <summary>
    /// Invalida todas as sessões e tokens atrelados a uma família no Redis.
    /// </summary>
    Task InvalidateFamilyAsync(string familyId, CancellationToken ct = default);
}
