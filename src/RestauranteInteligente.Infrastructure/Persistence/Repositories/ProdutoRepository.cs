using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de catálogo de produtos e fichas técnicas com escopo multi-tenant e leituras AsNoTracking.
/// </summary>
public sealed class ProdutoRepository : IProdutoRepository
{
    private readonly AppDbContext _context;

    public ProdutoRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Produto?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        // Protegido pelo Global Query Filter do tenant em contexto (Anti-IDOR)
        return await _context.Produtos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<IReadOnlyList<Produto>> ListarTodosAsync(CancellationToken ct = default)
    {
        return await _context.Produtos
            .AsNoTracking()
            .OrderBy(p => p.Nome)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Produto>> ObterTodosAtivosAsync(CancellationToken ct = default)
    {
        return await _context.Produtos
            .AsNoTracking()
            .Where(p => p.Ativo)
            .OrderBy(p => p.Nome)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Produto>> ObterPorIdsComFichaTecnicaAsync(IReadOnlyList<Guid> ids, CancellationToken ct = default)
    {
        if (ids == null || ids.Count == 0)
            return [];

        return await _context.Produtos
            .AsNoTracking()
            .Include(p => p.FichaTecnica)
            .Where(p => ids.Contains(p.Id))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ProdutoInsumo>> ObterFichasTecnicasCompletasAsync(CancellationToken ct = default)
    {
        return await _context.ProdutosInsumos
            .AsNoTracking()
            .Include(pi => pi.Insumo)
            .Include(pi => pi.Produto)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(Produto produto, CancellationToken ct = default)
    {
        await _context.Produtos.AddAsync(produto, ct);
    }
}
