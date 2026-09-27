using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de catálogo de produtos com escopo multi-tenant e proteção anti-IDOR.
/// </summary>
public sealed class ProdutoRepository : IProdutoRepository
{
    private readonly IAppDbContext _context;

    public ProdutoRepository(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Produto?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        // Protegido pelo Global Query Filter do tenant em contexto (Anti-IDOR)
        return await _context.Produtos.FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<IReadOnlyList<Produto>> ListarTodosAsync(CancellationToken ct = default)
    {
        return await _context.Produtos.ToListAsync(ct);
    }

    public async Task AdicionarAsync(Produto produto, CancellationToken ct = default)
    {
        await _context.Produtos.AddAsync(produto, ct);
        await _context.SaveChangesAsync(ct);
    }
}
