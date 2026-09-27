using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Livro-razão (Ledger) imutável de estoque (Append-Only).
/// Reflete rigorosamente a tabela MovimentacoesEstoque da DDL PostgreSQL.
/// Esta entidade nunca sofre UPDATE ou DELETE.
/// </summary>
public sealed class MovimentacaoEstoque : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid InsumoId { get; private set; }
    public TipoMovimentacao Tipo { get; private set; }
    public decimal Quantidade { get; private set; }
    public DateTimeOffset DataHora { get; private set; } = DateTimeOffset.UtcNow;
    public OrigemMovimentacao Origem { get; private set; }
    public Guid? ReferenciaId { get; private set; }
    public string? Observacao { get; private set; }

    private MovimentacaoEstoque() { }

    public MovimentacaoEstoque(
        Guid id,
        Guid restauranteId,
        Guid insumoId,
        TipoMovimentacao tipo,
        OrigemMovimentacao origem,
        decimal quantidade,
        DateTimeOffset? dataHora = null,
        Guid? referenciaId = null,
        string? observacao = null)
    {
        if (quantidade <= 0m)
            throw new ArgumentException("A quantidade movimentada deve ser estritamente positiva.", nameof(quantidade));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        InsumoId = insumoId;
        Tipo = tipo;
        Origem = origem;
        Quantidade = quantidade;
        DataHora = dataHora ?? DateTimeOffset.UtcNow;
        ReferenciaId = referenciaId;
        Observacao = observacao?.Trim();
    }
}
