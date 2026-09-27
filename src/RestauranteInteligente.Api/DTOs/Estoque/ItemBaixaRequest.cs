namespace RestauranteInteligente.Api.DTOs.Estoque;

/// <summary>
/// Contrato de entrada para item de baixa de estoque via API.
/// </summary>
public sealed record ItemBaixaRequest(Guid InsumoId, decimal Quantidade);
