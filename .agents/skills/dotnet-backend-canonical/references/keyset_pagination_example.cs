// ==============================================================================
// Manual Canónico de Backend: ASP.NET Core (.NET 9 / C# 13)
// Paginação de Alta Performance Baseada em Chaves (Keyset Pagination)
// ==============================================================================

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Application.Common.Models;

/// <summary>
/// Envelope padronizado para respostas de coleções paginadas na API REST.
/// </summary>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    string? NextCursor,
    bool HasMore
);

public sealed record MovimentacaoResumoDto(
    Guid Id,
    TipoMovimentacao Tipo,
    decimal Quantidade,
    DateTimeOffset DataHora,
    OrigemMovimentacao Origem
);

public static class KeysetCursorHelper
{
    public static string EncodeCursor(DateTimeOffset dataHora, Guid id)
    {
        var raw = $"{dataHora.ToUnixTimeMilliseconds()}:{id}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
    }

    public static (DateTimeOffset? DataHora, Guid? Id) DecodeCursor(string? cursor)
    {
        if (string.IsNullOrWhiteSpace(cursor))
            return (null, null);

        try
        {
            var raw = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = raw.Split(':');
            if (parts.Length == 2 &&
                long.TryParse(parts[0], out var unixMs) &&
                Guid.TryParse(parts[1], out var id))
            {
                return (DateTimeOffset.FromUnixTimeMilliseconds(unixMs), id);
            }
        }
        catch
        {
            // Cursor malformado é tratado como início de paginação
        }

        return (null, null);
    }
}

namespace RestauranteInteligente.Application.UseCases.Insumos;

using RestauranteInteligente.Application.Common.Models;

public sealed class ObterHistoricoMovimentacoesService
{
    private readonly IAppDbContext _context;

    public ObterHistoricoMovimentacoesService(IAppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Executa a busca paginada com custo algorítmico O(log N) sobre o par ordenado (DataHora, Id),
    /// eliminando o custo proibitivo O(N) do padrão tradicional Skip(n).Take(m).
    /// </summary>
    public async Task<PagedResult<MovimentacaoResumoDto>> ObterHistoricoKeysetAsync(
        Guid insumoId,
        string? cursor,
        int tamanhoPagina,
        CancellationToken cancellationToken = default)
    {
        tamanhoPagina = Math.Clamp(tamanhoPagina, 1, 100);
        var (cursorData, cursorId) = KeysetCursorHelper.DecodeCursor(cursor);

        var query = _context.MovimentacoesEstoque
            .AsNoTracking()
            .Where(m => m.InsumoId == insumoId);

        // Aplicação da condição de Keyset Pagination sobre a tupla (DataHora, Id)
        if (cursorData.HasValue && cursorId.HasValue)
        {
            query = query.Where(m => m.DataHora < cursorData.Value || 
                                    (m.DataHora == cursorData.Value && m.Id < cursorId.Value));
        }

        // Busca n + 1 registros para determinar deterministamente se há mais registros (HasMore)
        var registros = await query
            .OrderByDescending(m => m.DataHora)
            .ThenByDescending(m => m.Id)
            .Take(tamanhoPagina + 1)
            .Select(m => new MovimentacaoResumoDto(
                m.Id,
                m.Tipo,
                m.Quantidade,
                m.DataHora,
                m.Origem
            ))
            .ToListAsync(cancellationToken);

        var hasMore = registros.Count > tamanhoPagina;
        var itensPaginados = hasMore ? registros.Take(tamanhoPagina).ToList() : registros;

        string? nextCursor = null;
        if (hasMore && itensPaginados.Any())
        {
            var ultimoItem = itensPaginados.Last();
            nextCursor = KeysetCursorHelper.EncodeCursor(ultimoItem.DataHora, ultimoItem.Id);
        }

        return new PagedResult<MovimentacaoResumoDto>(itensPaginados, nextCursor, hasMore);
    }
}
