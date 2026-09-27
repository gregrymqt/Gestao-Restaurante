using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de insumos com disciplina anti-deadlock e consultas otimizadas sem tracking.
/// </summary>
public sealed class InsumoRepository : IInsumoRepository
{
    private readonly AppDbContext _context;

    public InsumoRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Insumo?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        // Consulta sem tracking protegida pelo Global Query Filter do tenant em contexto (Anti-IDOR)
        return await _context.Insumos
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, ct);
    }

    public async Task<IReadOnlyList<Insumo>> ObterTodosAtivosAsync(CancellationToken ct = default)
    {
        return await _context.Insumos
            .AsNoTracking()
            .Where(i => i.Ativo)
            .OrderBy(i => i.Nome)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Insumo>> ObterPorIdsParaAtualizacaoAsync(IReadOnlyList<Guid> ids, CancellationToken ct = default)
    {
        if (ids == null || ids.Count == 0)
            return [];

        // REGRA CRÍTICA ANTI-DEADLOCK: Ordenação determinística ascendente dos IDs antes do bloqueio pessimista
        var sortedIds = ids.Distinct().OrderBy(id => id).ToArray();

        // Bloqueio pessimista no PostgreSQL utilizando FOR UPDATE sob transação ativa (mantém tracking para mutação)
        return await _context.Insumos
            .FromSqlRaw("SELECT * FROM \"Insumos\" WHERE \"Id\" = ANY({0}) ORDER BY \"Id\" ASC FOR UPDATE", sortedIds)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(Insumo insumo, CancellationToken ct = default)
    {
        await _context.Insumos.AddAsync(insumo, ct);
    }

    public async Task AdicionarMovimentacaoAsync(MovimentacaoEstoque movimentacao, CancellationToken ct = default)
    {
        await _context.MovimentacoesEstoque.AddAsync(movimentacao, ct);
    }
}
