using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de Assinaturas e Planos com seeding garantido em tempo de execução para os planos padrão.
/// </summary>
public sealed class AssinaturaRepository : IAssinaturaRepository
{
    private static readonly IReadOnlyList<Plano> PlanosPadrao =
    [
        new(
            id: Guid.Parse("11111111-1111-1111-1111-111111111111"),
            nome: "Plano Starter",
            descricao: "Gestão operacional completa de estoque, caixa diário e controle financeiro.",
            precoMensal: 99.00m,
            possuiModuloIa: false,
            ativo: true
        ),
        new(
            id: Guid.Parse("22222222-2222-2222-2222-222222222222"),
            nome: "Plano Pro Inteligente (IA)",
            descricao: "Tudo do Starter + Previsão de Demanda com IA (HistGradientBoosting), meteorologia e alertas SSE em tempo real.",
            precoMensal: 189.00m,
            possuiModuloIa: true,
            ativo: true
        )
    ];

    private readonly AppDbContext _context;

    public AssinaturaRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Assinatura?> ObterPorRestauranteIdAsync(Guid restauranteId, CancellationToken ct = default)
    {
        return await _context.Assinaturas
            .FirstOrDefaultAsync(a => a.RestauranteId == restauranteId, ct);
    }

    public async Task AdicionarAsync(Assinatura assinatura, CancellationToken ct = default)
    {
        if (assinatura == null)
            throw new ArgumentNullException(nameof(assinatura));

        await _context.Assinaturas.AddAsync(assinatura, ct);
    }

    public Task AtualizarAsync(Assinatura assinatura, CancellationToken ct = default)
    {
        if (assinatura == null)
            throw new ArgumentNullException(nameof(assinatura));

        _context.Assinaturas.Update(assinatura);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<Plano>> ObterPlanosAtivosAsync(CancellationToken ct = default)
    {
        var planosDb = await _context.Planos
            .AsNoTracking()
            .Where(p => p.Ativo)
            .ToListAsync(ct);

        if (planosDb.Count > 0)
            return planosDb;

        return PlanosPadrao;
    }

    public async Task<Plano?> ObterPlanoPorIdAsync(Guid planoId, CancellationToken ct = default)
    {
        var planoDb = await _context.Planos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == planoId, ct);

        if (planoDb != null)
            return planoDb;

        return PlanosPadrao.FirstOrDefault(p => p.Id == planoId);
    }
}
