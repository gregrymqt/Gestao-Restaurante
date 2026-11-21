using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Repositório para sessões de fechamento de caixa operacional.
/// </summary>
public interface IFechamentoCaixaRepository
{
    Task<FechamentoCaixa?> ObterCaixaAbertoAsync(CancellationToken ct = default);
    Task<FechamentoCaixa?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task AdicionarAsync(FechamentoCaixa fechamentoCaixa, CancellationToken ct = default);
    Task AdicionarMovimentacaoAsync(MovimentacaoCaixa movimentacao, CancellationToken ct = default);
    Task<IReadOnlyList<MovimentacaoCaixa>> ObterMovimentacoesPorCaixaIdAsync(Guid fechamentoCaixaId, CancellationToken ct = default);
}
