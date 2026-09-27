using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de sessões de caixa operacional com controle de tracking sob demanda.
/// </summary>
public sealed class FechamentoCaixaRepository : IFechamentoCaixaRepository
{
    private readonly AppDbContext _context;

    public FechamentoCaixaRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<FechamentoCaixa?> ObterCaixaAbertoAsync(CancellationToken ct = default)
    {
        // Rastreamento ativado explicitamente para permitir mutações de estado (RegistrarVenda / Encerrar)
        return await _context.FechamentosCaixa
            .AsTracking()
            .FirstOrDefaultAsync(c => c.Status == "ABERTO", ct);
    }

    public async Task<FechamentoCaixa?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.FechamentosCaixa
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AdicionarAsync(FechamentoCaixa fechamentoCaixa, CancellationToken ct = default)
    {
        await _context.FechamentosCaixa.AddAsync(fechamentoCaixa, ct);
    }
}
