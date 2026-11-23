using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Repositório de ordens de compra de insumos.
/// </summary>
public interface IOrdemCompraRepository
{
    Task AdicionarAsync(OrdemCompra ordemCompra, CancellationToken ct = default);
    Task<OrdemCompra?> ObterPorProtocoloAsync(string protocolo, CancellationToken ct = default);
    Task<OrdemCompra?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<OrdemCompra>> ListarAsync(string? status = null, CancellationToken ct = default);
    Task<OrdemCompra?> ObterParaAtualizacaoAsync(Guid id, CancellationToken ct = default);
}
