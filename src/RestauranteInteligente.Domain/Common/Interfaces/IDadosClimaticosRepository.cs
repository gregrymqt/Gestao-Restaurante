using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Repositório de dados e previsões meteorológicas com escopo multi-tenant.
/// </summary>
public interface IDadosClimaticosRepository
{
    Task<DadosClimaticos?> ObterPorDataAsync(DateOnly data, CancellationToken ct = default);
    Task<DadosClimaticos?> ObterMaisRecenteAsync(CancellationToken ct = default);
    Task AdicionarAsync(DadosClimaticos dadosClimaticos, CancellationToken ct = default);
}
