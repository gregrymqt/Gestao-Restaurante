namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Resultado da geração de um token JWT.
/// </summary>
public sealed record JwtTokenResult(
    string Token,
    string Jti,
    DateTimeOffset ExpiresAt
);

/// <summary>
/// Contrato para emissão segura de tokens JWT tipados e compatíveis com o ecossistema multi-tenant.
/// </summary>
public interface IJwtTokenGenerator
{
    JwtTokenResult GenerateToken(
        Guid userId,
        Guid restauranteId,
        string email,
        string role,
        TimeSpan? lifetime = null);
}
