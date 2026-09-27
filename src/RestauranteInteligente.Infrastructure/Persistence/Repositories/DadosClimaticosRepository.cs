using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de dados meteorológicos históricos e preditivos.
/// </summary>
public sealed class DadosClimaticosRepository : IDadosClimaticosRepository
{
    private readonly AppDbContext _context;

    public DadosClimaticosRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<DadosClimaticos?> ObterPorDataAsync(DateOnly data, CancellationToken ct = default)
    {
        // Tracking ativado para permitir mutações de upsert via AtualizarClima
        return await _context.DadosClimaticos
            .AsTracking()
            .FirstOrDefaultAsync(d => d.Data == data, ct);
    }

    public async Task<DadosClimaticos?> ObterMaisRecenteAsync(CancellationToken ct = default)
    {
        return await _context.DadosClimaticos
            .AsNoTracking()
            .OrderByDescending(d => d.Data)
            .FirstOrDefaultAsync(ct);
    }

    public async Task AdicionarAsync(DadosClimaticos dadosClimaticos, CancellationToken ct = default)
    {
        await _context.DadosClimaticos.AddAsync(dadosClimaticos, ct);
    }
}
