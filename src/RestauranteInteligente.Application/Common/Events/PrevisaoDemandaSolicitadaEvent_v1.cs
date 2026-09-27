using System.Text.Json.Serialization;

namespace RestauranteInteligente.Application.Common.Events;

/// <summary>
/// Contrato canônico versionado v1 para solicitação assíncrona de inferência de previsão de demanda
/// disparado pelo backend C# após o encerramento do caixa e consumido pelo Worker Python.
/// Serializado em Raw JSON com nomenclatura camelCase para estrita interoperabilidade com Pydantic V2.
/// </summary>
public sealed record PrevisaoDemandaSolicitadaEvent_v1(
    [property: JsonPropertyName("correlationId")] Guid CorrelationId,
    [property: JsonPropertyName("restauranteId")] Guid RestauranteId,
    [property: JsonPropertyName("dataAlvo")] DateOnly DataAlvo,
    [property: JsonPropertyName("produtos")] IReadOnlyList<ProdutoPrevisaoItemPayloadDto> Produtos,
    [property: JsonPropertyName("clima")] ParametroMeteorologicoPayloadDto Clima,
    [property: JsonPropertyName("historicoVendas")] IReadOnlyList<HistoricoVendaPontoPayloadDto> HistoricoVendas
);

public sealed record ProdutoPrevisaoItemPayloadDto(
    [property: JsonPropertyName("produtoId")] Guid ProdutoId,
    [property: JsonPropertyName("precoVenda")] decimal PrecoVenda
);

public sealed record ParametroMeteorologicoPayloadDto(
    [property: JsonPropertyName("temperatura")] decimal Temperatura,
    [property: JsonPropertyName("precipitacao")] decimal Precipitacao,
    [property: JsonPropertyName("umidade")] decimal Umidade
);

public sealed record HistoricoVendaPontoPayloadDto(
    [property: JsonPropertyName("data")] DateOnly Data,
    [property: JsonPropertyName("quantidade")] int Quantidade
);
