namespace RestauranteInteligente.Api.DTOs.Estoque;

/// <summary>
/// Contrato de entrada para criação de novos insumos/matérias-primas via aplicativo móvel.
/// </summary>
public sealed record CadastrarInsumoRequest
{
    public string Nome { get; init; } = string.Empty;
    public string UnidadeMedida { get; init; } = string.Empty;
    public decimal EstoqueMinimo { get; init; }
    public decimal CustoUnitario { get; init; }
    public decimal? SaldoInicial { get; init; }
    public string? Categoria { get; init; }
}
