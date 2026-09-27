namespace RestauranteInteligente.Application.Previsoes.DTOs;

/// <summary>
/// Relatório consolidado contendo análise de capacidade produtiva por produto e insumos com necessidade de reposição.
/// </summary>
public sealed record RelatorioCapacidadeProducaoDto(
    DateOnly DataReferencia,
    IReadOnlyList<ItemCapacidadeProducaoDto> ItensCapacidade,
    IReadOnlyList<SugestaoReposicaoInsumoDto> SugestoesReposicao
);
