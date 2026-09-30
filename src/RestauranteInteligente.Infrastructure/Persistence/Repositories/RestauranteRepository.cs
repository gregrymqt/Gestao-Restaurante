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

    public async Task<bool> ExisteCnpjAsync(string cnpj, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(cnpj))
            return false;

        var cnpjLimpo = cnpj.Trim();
        return await _context.Restaurantes
            .AsNoTracking()
            .AnyAsync(r => r.Cnpj == cnpjLimpo, ct);
    }

    public async Task AdicionarAsync(Restaurante restaurante, CancellationToken ct = default)
    {
        if (restaurante == null)
            throw new ArgumentNullException(nameof(restaurante));

        await _context.Restaurantes.AddAsync(restaurante, ct);
    }
}
