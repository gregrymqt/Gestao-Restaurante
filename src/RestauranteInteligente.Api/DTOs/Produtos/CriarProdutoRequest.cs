namespace RestauranteInteligente.Api.DTOs.Produtos;

/// <summary>
/// Especificação de ingrediente e quantidade consumida para a ficha técnica do produto.
/// </summary>
public sealed record ItemFichaTecnicaRequest
{
    public Guid InsumoId { get; init; }
    public decimal Quantidade { get; init; }
}

/// <summary>
/// Contrato de entrada para criação de produto via API com suporte opcional a Ficha Técnica (BOM).
/// </summary>
public sealed record CriarProdutoRequest
{
    public string Nome { get; init; } = string.Empty;
    public string? Descricao { get; init; }
    public decimal Preco { get; init; }
    public IReadOnlyList<ItemFichaTecnicaRequest>? FichaTecnica { get; init; }
}
