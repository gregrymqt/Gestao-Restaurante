using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato de repositório para persistência e validação de identidades de usuários.
/// </summary>
public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default);
    Task<bool> ExisteEmailAsync(string email, CancellationToken ct = default);
    Task AdicionarAsync(Usuario usuario, CancellationToken ct = default);
}
