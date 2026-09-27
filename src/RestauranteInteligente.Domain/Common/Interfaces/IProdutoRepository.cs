using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Repositório de catálogo de produtos com escopo multi-tenant e proteção anti-IDOR.
/// </summary>
public interface IProdutoRepository
{
    Task<Produto?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Produto>> ListarTodosAsync(CancellationToken ct = default);
    Task AdicionarAsync(Produto produto, CancellationToken ct = default);
}
