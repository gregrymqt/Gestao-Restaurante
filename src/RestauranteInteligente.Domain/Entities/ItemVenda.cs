using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Item detalhado de uma venda com congelamento imutável do preço unitário praticado.
/// </summary>
public sealed class ItemVenda : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid VendaId { get; private set; }
    public Guid ProdutoId { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal PrecoUnitario { get; private set; }
    public decimal Subtotal { get; private set; }

    // Navegações de Domínio / EF Core
    public Venda? Venda { get; private set; }
    public Produto? Produto { get; private set; }

    private ItemVenda() { }

    public ItemVenda(
        Guid id,
        Guid restauranteId,
        Guid vendaId,
        Guid produtoId,
        decimal quantidade,
        decimal precoUnitario)
    {
        if (vendaId == Guid.Empty)
            throw new ArgumentException("O identificador da venda é obrigatório.", nameof(vendaId));

        if (produtoId == Guid.Empty)
            throw new ArgumentException("O identificador do produto é obrigatório.", nameof(produtoId));

        if (quantidade <= 0m)
            throw new ArgumentException("A quantidade vendida deve ser maior que zero.", nameof(quantidade));

        if (precoUnitario < 0m)
            throw new ArgumentException("O preço unitário congelado não pode ser negativo.", nameof(precoUnitario));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        VendaId = vendaId;
        ProdutoId = produtoId;
        Quantidade = quantidade;
        PrecoUnitario = precoUnitario;
        Subtotal = Math.Round(quantidade * precoUnitario, 2, MidpointRounding.AwayFromZero);
    }
}
