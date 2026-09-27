using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Livro-razão (Ledger) imutável de estoque (Append-Only).
/// Esta entidade nunca sofre UPDATE ou DELETE.
/// </summary>
public sealed class MovimentacaoEstoque : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid InsumoId { get; private set; }
    public TipoMovimentacao Tipo { get; private set; }
    public OrigemMovimentacao Origem { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal CustoUnitarioMomento { get; private set; }
    public string? Motivo { get; private set; }
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    private MovimentacaoEstoque() { }

    public MovimentacaoEstoque(
        Guid id,
        Guid restauranteId,
        Guid insumoId,
        TipoMovimentacao tipo,
        OrigemMovimentacao origem,
        decimal quantidade,
        decimal custoUnitarioMomento,
        string? motivo = null)
    {
        if (quantidade <= 0m)
            throw new ArgumentException("A quantidade movimentada deve ser estritamente positiva.", nameof(quantidade));

        if (custoUnitarioMomento < 0m)
            throw new ArgumentException("O custo unitário do momento não pode ser negativo.", nameof(custoUnitarioMomento));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        InsumoId = insumoId;
        Tipo = tipo;
        Origem = origem;
        Quantidade = quantidade;
        CustoUnitarioMomento = custoUnitarioMomento;
        Motivo = motivo;
        CriadoEm = DateTimeOffset.UtcNow;
    }
}
