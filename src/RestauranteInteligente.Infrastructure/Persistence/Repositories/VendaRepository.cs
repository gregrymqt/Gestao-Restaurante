using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de vendas e itens de venda com isolamento multi-tenant e consultas AsNoTracking.
/// </summary>
public sealed class VendaRepository : IVendaRepository
{
    private readonly AppDbContext _context;

    public VendaRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Venda?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Vendas
            .AsNoTracking()
            .Include(v => v.Itens)
            .FirstOrDefaultAsync(v => v.Id == id, ct);
    }

    public async Task<IReadOnlyList<Venda>> ObterVendasConcluidasPorPeriodoAsync(DateTimeOffset dataInicio, CancellationToken ct = default)
    {
        return await _context.Vendas
            .AsNoTracking()
            .Where(v => v.Status == "CONCLUIDA" && v.DataHora >= dataInicio)
            .Include(v => v.Itens)
            .OrderBy(v => v.DataHora)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(Venda venda, CancellationToken ct = default)
    {
        await _context.Vendas.AddAsync(venda, ct);
    }
}
