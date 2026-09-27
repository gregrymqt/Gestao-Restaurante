using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Api.DTOs.Estoque;

/// <summary>
/// Contrato de entrada para solicitação de baixa de estoque via API.
/// </summary>
public sealed record BaixaEstoqueRequest(
    List<ItemBaixaRequest> Itens,
    OrigemMovimentacao? Origem = null,
    string? Motivo = null
);
