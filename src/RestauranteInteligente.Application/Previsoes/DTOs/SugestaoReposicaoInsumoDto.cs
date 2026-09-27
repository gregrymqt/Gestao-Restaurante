namespace RestauranteInteligente.Application.Previsoes.DTOs;

/// <summary>
/// Sugestão consolidada de compra/reposição de insumo baseada no déficit da demanda prevista agregada.
/// </summary>
public sealed record SugestaoReposicaoInsumoDto(
    Guid InsumoId,
    string NomeInsumo,
    string UnidadeMedida,
    decimal StockAtual,
    decimal StockNecessario,
    decimal QuantidadeComprar
);
