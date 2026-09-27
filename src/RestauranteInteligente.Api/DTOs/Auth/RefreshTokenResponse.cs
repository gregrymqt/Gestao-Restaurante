namespace RestauranteInteligente.Api.DTOs.Auth;

/// <summary>
/// Contrato de resposta para renovação de token.
/// </summary>
public sealed record RefreshTokenResponse(string Token, string RefreshToken, string Jti, DateTimeOffset ExpiresAt);
