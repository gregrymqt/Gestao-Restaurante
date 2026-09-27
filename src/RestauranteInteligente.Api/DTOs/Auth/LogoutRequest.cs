namespace RestauranteInteligente.Api.DTOs.Auth;

/// <summary>
/// Contrato de entrada para logout e revogação de tokens.
/// </summary>
public sealed record LogoutRequest(string? RefreshToken = null);
