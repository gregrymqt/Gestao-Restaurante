namespace RestauranteInteligente.Api.DTOs.Previsoes;

public sealed record ItemOrdemCompraApiRequestDto(
    Guid? InsumoId,
    decimal Quantidade,
    decimal? PrecoUnitario = null,
    string? NomeInsumo = null,
    string? UnidadeMedida = null
);

public sealed record CriarOrdemCompraApiRequestDto(
    List<ItemOrdemCompraApiRequestDto>? Itens = null,
    List<ItemOrdemCompraApiRequestDto>? Insumos = null,
    decimal? ValorTotal = null
);
