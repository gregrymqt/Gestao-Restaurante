using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Repositório de insumos com disciplina anti-deadlock e proteção contra IDOR.
/// </summary>
public interface IInsumoRepository
{
    Task<Insumo?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Insumo>> ObterTodosAtivosAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Insumo>> ObterPorIdsParaAtualizacaoAsync(IReadOnlyList<Guid> ids, CancellationToken ct = default);
    Task AdicionarAsync(Insumo insumo, CancellationToken ct = default);
    Task AdicionarMovimentacaoAsync(MovimentacaoEstoque movimentacao, CancellationToken ct = default);
}
