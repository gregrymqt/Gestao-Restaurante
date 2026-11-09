using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato do repositório para grupos e opções de modificadores, segregado por RestauranteId sob RLS.
/// </summary>
public interface IGrupoModificadorRepository
{
    Task<GrupoModificador?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<GrupoModificador>> ObterPorIdsAsync(IReadOnlyList<Guid> ids, CancellationToken ct = default);
    Task<IReadOnlyList<GrupoModificador>> ObterPorProdutoIdAsync(Guid produtoId, CancellationToken ct = default);
    Task<IReadOnlyList<GrupoModificador>> ListarTodosAsync(CancellationToken ct = default);
    Task AdicionarAsync(GrupoModificador grupo, CancellationToken ct = default);
    Task VincularProdutoAsync(ProdutoGrupoModificador vinculo, CancellationToken ct = default);
}
