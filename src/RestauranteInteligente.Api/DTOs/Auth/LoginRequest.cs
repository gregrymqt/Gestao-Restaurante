namespace RestauranteInteligente.Api.DTOs.Auth;

/// <summary>
/// Contrato de entrada para requisição de login e emissão de tokens.
/// </summary>
public sealed record LoginRequest(string Email, string Password, Guid? RestauranteId = null);
