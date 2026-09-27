namespace RestauranteInteligente.Api.DTOs.Auth;

/// <summary>
/// Contrato de entrada para renovação de token.
/// </summary>
public sealed record RefreshTokenRequest(string RefreshToken);
