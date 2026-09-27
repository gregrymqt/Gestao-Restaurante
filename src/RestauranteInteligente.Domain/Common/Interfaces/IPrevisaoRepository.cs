using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Repositório de previsões de demanda geradas pelo pipeline assíncrono de Machine Learning.
/// </summary>
public interface IPrevisaoRepository
{
    Task<IReadOnlyList<Previsao>> ObterPorDataAlvoAsync(DateOnly dataAlvo, CancellationToken ct = default);
    Task<Previsao?> ObterPorProdutoEDataAsync(Guid produtoId, DateOnly dataPrevisao, CancellationToken ct = default);
    Task AdicionarAsync(Previsao previsao, CancellationToken ct = default);
}
