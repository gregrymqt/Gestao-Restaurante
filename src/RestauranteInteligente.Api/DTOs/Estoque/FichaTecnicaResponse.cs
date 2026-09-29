namespace RestauranteInteligente.Api.DTOs.Estoque;

public sealed record FichaTecnicaIngredienteResponse(
    Guid InsumoId,
    string Nome,
    string Quantidade
);

public sealed record FichaTecnicaResponse(
    Guid Id,
    string Nome,
    string Categoria,
    string? ImagemUrl,
    IReadOnlyList<FichaTecnicaIngredienteResponse> Ingredientes,
    decimal CustoInsumos,
    decimal PrecoBalcao,
    decimal MargemBrutaPercentual,
    int CapacidadeTurnoPorcoes
);
