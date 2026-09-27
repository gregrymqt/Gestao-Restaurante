using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Repositório de vendas com escopo multi-tenant e proteção anti-IDOR.
/// </summary>
public interface IVendaRepository
{
    Task<Venda?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Venda>> ObterVendasConcluidasPorPeriodoAsync(DateTimeOffset dataInicio, CancellationToken ct = default);
    Task AdicionarAsync(Venda venda, CancellationToken ct = default);
}
