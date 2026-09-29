namespace RestauranteInteligente.Api.DTOs.Estoque;

/// <summary>
/// Projeção de dados de insumo com cálculos de criticidade e saldo para o frontend móvel.
/// </summary>
public sealed record InsumoResponse(
    Guid Id,
    string Nome,
    string Sku,
    string Categoria,
    decimal SaldoAtual,
    decimal EstoqueMinimo,
    decimal? EstoqueIdeal,
    string UnidadeMedida,
    string StatusNivel,
    decimal PercentualCapacidade,
    decimal DeficitQuantidade,
    decimal CustoUnitarioMedio
);
