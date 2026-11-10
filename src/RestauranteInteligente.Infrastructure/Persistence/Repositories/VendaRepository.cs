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
                .ThenInclude(i => i.Produto)
            .FirstOrDefaultAsync(v => v.Id == id, ct);
    }

    public async Task<IReadOnlyList<Venda>> ObterVendasConcluidasPorPeriodoAsync(DateTimeOffset dataInicio, CancellationToken ct = default)
    {
        return await _context.Vendas
            .AsNoTracking()
            .Where(v => v.Status == "CONCLUIDA" && v.DataHora >= dataInicio)
            .Include(v => v.Itens)
                .ThenInclude(i => i.Produto)
            .OrderByDescending(v => v.DataHora)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Venda>> ObterUltimasVendasAsync(int limite = 50, CancellationToken ct = default)
    {
        return await _context.Vendas
            .AsNoTracking()
            .Where(v => v.Status == "CONCLUIDA")
            .Include(v => v.Itens)
                .ThenInclude(i => i.Produto)
            .OrderByDescending(v => v.DataHora)
            .Take(limite)
            .ToListAsync(ct);
    }

    public async Task<Venda?> ObterPorIdParaAtualizacaoAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Vendas
            .AsTracking()
            .Include(v => v.Itens)
                .ThenInclude(i => i.Produto)
            .FirstOrDefaultAsync(v => v.Id == id, ct);
    }

    public async Task<IReadOnlyList<Venda>> ObterPedidosAtivosKdsAsync(CancellationToken ct = default)
    {
        return await _context.Vendas
            .AsNoTracking()
            .Where(v => v.Status == "CONCLUIDA" &&
                        (v.StatusPreparo == "RECEBIDO" || v.StatusPreparo == "EM_PREPARO" || v.StatusPreparo == "PRONTO"))
            .Include(v => v.Itens)
                .ThenInclude(i => i.Produto)
            .OrderBy(v => v.DataHora)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(Venda venda, CancellationToken ct = default)
    {
        await _context.Vendas.AddAsync(venda, ct);
    }
}
