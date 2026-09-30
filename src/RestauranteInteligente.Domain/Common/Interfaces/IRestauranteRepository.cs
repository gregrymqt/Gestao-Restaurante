using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Repositório de dados cadastrais e geográficos do restaurante (Tenant).
/// </summary>
public interface IRestauranteRepository
{
    Task<Restaurante?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExisteCnpjAsync(string cnpj, CancellationToken ct = default);
    Task AdicionarAsync(Restaurante restaurante, CancellationToken ct = default);
}
