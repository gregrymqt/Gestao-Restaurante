namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato canônico para verificação e inclusão de tokens JWT na Blacklist distribuída do Redis.
/// </summary>
public interface ITokenBlacklistService
{
    /// <summary>
    /// Adiciona o identificador único do token (jti) à blacklist com expiração equivalente ao tempo restante do token.
    /// </summary>
    Task RevokeTokenAsync(string jti, TimeSpan remainingTtl, CancellationToken ct = default);

    /// <summary>
    /// Verifica se o token já se encontra revogado na blacklist.
    /// </summary>
    Task<bool> IsTokenRevokedAsync(string jti, CancellationToken ct = default);
}
