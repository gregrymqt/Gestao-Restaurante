using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Item detalhado de uma ordem de compra de insumos.
/// </summary>
public sealed class ItemOrdemCompra : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid OrdemCompraId { get; private set; }
    public Guid InsumoId { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal PrecoUnitarioEstimado { get; private set; }
    public decimal SubtotalEstimado { get; private set; }

    // Navegações EF Core
    public OrdemCompra? OrdemCompra { get; private set; }
    public Insumo? Insumo { get; private set; }

    private ItemOrdemCompra() { }

    public ItemOrdemCompra(
        Guid id,
        Guid restauranteId,
        Guid ordemCompraId,
        Guid insumoId,
        decimal quantidade,
        decimal precoUnitarioEstimado)
    {
        if (ordemCompraId == Guid.Empty)
            throw new ArgumentException("O identificador da ordem de compra é obrigatório.", nameof(ordemCompraId));

        if (insumoId == Guid.Empty)
            throw new ArgumentException("O identificador do insumo é obrigatório.", nameof(insumoId));

        if (quantidade <= 0m)
            throw new ArgumentException("A quantidade requisitada deve ser maior que zero.", nameof(quantidade));

        if (precoUnitarioEstimado < 0m)
            throw new ArgumentException("O preço unitário estimado não pode ser negativo.", nameof(precoUnitarioEstimado));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        OrdemCompraId = ordemCompraId;
        InsumoId = insumoId;
        Quantidade = quantidade;
        PrecoUnitarioEstimado = precoUnitarioEstimado;
        SubtotalEstimado = Math.Round(quantidade * precoUnitarioEstimado, 2, MidpointRounding.AwayFromZero);
    }
}
