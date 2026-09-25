namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Modelo de conta de usuário com vinculação segura ao respectivo inquilino (RestauranteId).
/// </summary>
public sealed record UserAccount(
    Guid UserId,
    Guid RestauranteId,
    string Email,
    string PasswordHash,
    string Role
);

/// <summary>
/// Serviço de domínio para consulta de identidades de usuários autenticáveis.
/// </summary>
public interface IAuthUserService
{
    Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct = default);
}
