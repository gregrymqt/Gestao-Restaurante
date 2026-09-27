using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Ficha técnica (Bill of Materials - BOM): associação proporcional entre um Produto e um Insumo.
/// </summary>
public sealed class ProdutoInsumo : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid ProdutoId { get; private set; }
    public Guid InsumoId { get; private set; }
    public decimal QuantidadeInsumo { get; private set; }

    // Navegações de Domínio / EF Core
    public Produto? Produto { get; private set; }
    public Insumo? Insumo { get; private set; }

    private ProdutoInsumo() { }

    public ProdutoInsumo(
        Guid id,
        Guid restauranteId,
        Guid produtoId,
        Guid insumoId,
        decimal quantidadeInsumo)
    {
        if (produtoId == Guid.Empty)
            throw new ArgumentException("O identificador do produto é obrigatório.", nameof(produtoId));

        if (insumoId == Guid.Empty)
            throw new ArgumentException("O identificador do insumo é obrigatório.", nameof(insumoId));

        if (quantidadeInsumo <= 0m)
            throw new ArgumentException("A quantidade consumida do insumo deve ser maior que zero.", nameof(quantidadeInsumo));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        ProdutoId = produtoId;
        InsumoId = insumoId;
        QuantidadeInsumo = quantidadeInsumo;
    }

    public void AtualizarQuantidade(decimal novaQuantidade)
    {
        if (novaQuantidade <= 0m)
            throw new ArgumentException("A quantidade consumida do insumo deve ser maior que zero.", nameof(novaQuantidade));

        QuantidadeInsumo = novaQuantidade;
    }
}
