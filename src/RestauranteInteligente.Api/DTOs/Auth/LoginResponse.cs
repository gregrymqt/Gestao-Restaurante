namespace RestauranteInteligente.Api.DTOs.Auth;

/// <summary>
/// Contrato de resposta para autenticação bem-sucedida.
/// </summary>
public sealed record LoginResponse(
    string Token,
    string RefreshToken,
    string Jti,
    DateTimeOffset ExpiresAt,
    Guid RestauranteId,
    Guid UserId
);
