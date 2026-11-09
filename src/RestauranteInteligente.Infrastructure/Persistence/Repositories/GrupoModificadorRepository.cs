using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de grupos e opções de modificadores segregado por RestauranteId sob RLS e Query Filters.
/// </summary>
public sealed class GrupoModificadorRepository : IGrupoModificadorRepository
{
    private readonly AppDbContext _context;

    public GrupoModificadorRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<GrupoModificador?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.GruposModificadores
            .Include(g => g.Opcoes)
            .FirstOrDefaultAsync(g => g.Id == id, ct);
    }

    public async Task<IReadOnlyList<GrupoModificador>> ObterPorIdsAsync(IReadOnlyList<Guid> ids, CancellationToken ct = default)
    {
        if (ids == null || ids.Count == 0)
            return Array.Empty<GrupoModificador>();

        return await _context.GruposModificadores
            .Include(g => g.Opcoes)
            .Where(g => ids.Contains(g.Id))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<GrupoModificador>> ObterPorProdutoIdAsync(Guid produtoId, CancellationToken ct = default)
    {
        return await _context.ProdutosGruposModificadores
            .Include(pg => pg.GrupoModificador!)
                .ThenInclude(g => g.Opcoes)
            .Where(pg => pg.ProdutoId == produtoId && pg.GrupoModificador!.Ativo)
            .OrderBy(pg => pg.OrdemExibicao)
            .Select(pg => pg.GrupoModificador!)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<GrupoModificador>> ListarTodosAsync(CancellationToken ct = default)
    {
        return await _context.GruposModificadores
            .Include(g => g.Opcoes)
            .OrderBy(g => g.Nome)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(GrupoModificador grupo, CancellationToken ct = default)
    {
        await _context.GruposModificadores.AddAsync(grupo, ct);
    }

    public async Task VincularProdutoAsync(ProdutoGrupoModificador vinculo, CancellationToken ct = default)
    {
        await _context.ProdutosGruposModificadores.AddAsync(vinculo, ct);
    }
}
