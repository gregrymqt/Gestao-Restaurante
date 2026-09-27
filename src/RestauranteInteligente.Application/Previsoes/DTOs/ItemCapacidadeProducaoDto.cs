namespace RestauranteInteligente.Application.Previsoes.DTOs;

/// <summary>
/// Projeção da capacidade máxima de produção de um produto contra o estoque atual e análise de risco de rutura.
/// </summary>
public sealed record ItemCapacidadeProducaoDto(
    Guid ProdutoId,
    string NomeProduto,
    decimal DemandaPrevista,
    decimal CapacidadeMaximaProducao,
    decimal DemandaAtendivel,
    bool RiscoRutura,
    string InsumoGargaloNome,
    decimal DeficitUnidades
);
