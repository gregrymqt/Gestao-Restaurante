namespace RestauranteInteligente.Api.DTOs.Estoque;

/// <summary>
/// Contrato para registro de entrada de mercadorias no livro-razão imutável de estoque.
/// </summary>
public sealed record RegistrarEntradaEstoqueRequest
{
    public Guid InsumoId { get; init; }
    public decimal Quantidade { get; init; }
    public decimal? CustoUnitario { get; init; }
    public string? Observacao { get; init; }
}
