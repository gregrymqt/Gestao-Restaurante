using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Implementação EF Core para repositório de previsões de demanda com AsNoTracking em consultas de leitura.
/// </summary>
public sealed class PrevisaoRepository : IPrevisaoRepository
{
    private readonly AppDbContext _context;

    public PrevisaoRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IReadOnlyList<Previsao>> ObterPorDataAlvoAsync(DateOnly dataAlvo, CancellationToken ct = default)
    {
        return await _context.Previsoes
            .AsNoTracking()
            .Include(p => p.Produto)
            .Where(p => p.DataPrevisao == dataAlvo)
            .ToListAsync(ct);
    }

    public async Task<Previsao?> ObterPorProdutoEDataAsync(Guid produtoId, DateOnly dataPrevisao, CancellationToken ct = default)
    {
        return await _context.Previsoes
            .AsTracking()
            .FirstOrDefaultAsync(p => p.ProdutoId == produtoId && p.DataPrevisao == dataPrevisao, ct);
    }

    public async Task AdicionarAsync(Previsao previsao, CancellationToken ct = default)
    {
        await _context.Previsoes.AddAsync(previsao, ct);
    }
}
