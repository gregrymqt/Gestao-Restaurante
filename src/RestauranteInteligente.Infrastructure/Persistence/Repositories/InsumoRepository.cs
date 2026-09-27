using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repositório de insumos com disciplina anti-deadlock e proteção contra IDOR.
/// </summary>
public sealed class InsumoRepository : IInsumoRepository
{
    private readonly IAppDbContext _context;

    public InsumoRepository(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Insumo?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        // Protegido pelo Global Query Filter do tenant em contexto (Anti-IDOR)
        return await _context.Insumos.FirstOrDefaultAsync(i => i.Id == id, ct);
    }

    public async Task<IReadOnlyList<Insumo>> ObterPorIdsParaAtualizacaoAsync(IReadOnlyList<Guid> ids, CancellationToken ct = default)
    {
        if (ids == null || ids.Count == 0)
            return Array.Empty<Insumo>();

        // REGRA CRÍTICA ANTI-DEADLOCK: Ordenação determinística ascendente dos IDs antes do bloqueio pessimista
        var sortedIds = ids.Distinct().OrderBy(id => id).ToArray();

        // Bloqueio pessimista no PostgreSQL utilizando FOR UPDATE sob transação ativa
        return await _context.Insumos
            .FromSqlRaw("SELECT * FROM \"Insumos\" WHERE \"Id\" = ANY({0}) ORDER BY \"Id\" ASC FOR UPDATE", sortedIds)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(Insumo insumo, CancellationToken ct = default)
    {
        await _context.Insumos.AddAsync(insumo, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AdicionarMovimentacaoAsync(MovimentacaoEstoque movimentacao, CancellationToken ct = default)
    {
        await _context.MovimentacoesEstoque.AddAsync(movimentacao, ct);
        await _context.SaveChangesAsync(ct);
    }
}
