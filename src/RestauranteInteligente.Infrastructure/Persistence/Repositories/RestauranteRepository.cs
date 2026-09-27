using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Implementação EF Core para repositório de Restaurante com AsNoTracking.
/// </summary>
public sealed class RestauranteRepository : IRestauranteRepository
{
    private readonly AppDbContext _context;

    public RestauranteRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Restaurante?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Restaurantes
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, ct);
    }
}
