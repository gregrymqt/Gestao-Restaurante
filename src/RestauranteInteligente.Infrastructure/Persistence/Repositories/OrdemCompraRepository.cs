using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de ordens de compra de insumos.
/// </summary>
public sealed class OrdemCompraRepository : IOrdemCompraRepository
{
    private readonly AppDbContext _context;

    public OrdemCompraRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task AdicionarAsync(OrdemCompra ordemCompra, CancellationToken ct = default)
    {
        await _context.OrdensCompra.AddAsync(ordemCompra, ct);
    }

    public async Task<OrdemCompra?> ObterPorProtocoloAsync(string protocolo, CancellationToken ct = default)
    {
        var protocoloNormalizado = protocolo.Trim().ToUpperInvariant();
        return await _context.OrdensCompra
            .Include(o => o.Itens)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Protocolo == protocoloNormalizado, ct);
    }

    public async Task<OrdemCompra?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.OrdensCompra
            .Include(o => o.Itens)
                .ThenInclude(i => i.Insumo)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task<IReadOnlyList<OrdemCompra>> ListarAsync(string? status = null, CancellationToken ct = default)
    {
        var query = _context.OrdensCompra
            .Include(o => o.Itens)
                .ThenInclude(i => i.Insumo)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusNormalizado = status.Trim().ToUpperInvariant();
            query = query.Where(o => o.Status == statusNormalizado);
        }

        return await query
            .OrderByDescending(o => o.CriadoEm)
            .ToListAsync(ct);
    }

    public async Task<OrdemCompra?> ObterParaAtualizacaoAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.OrdensCompra
            .Include(o => o.Itens)
                .ThenInclude(i => i.Insumo)
            .AsTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }
}
