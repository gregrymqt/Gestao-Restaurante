using System.Text.Json.Serialization;

namespace RestauranteInteligente.Application.Common.Messages;

/// <summary>
/// Evento assíncrono emitido pelo backend C# após o fechamento de caixa,
/// solicitando inferência de previsão de demanda para um produto específico.
/// Serializado em Raw JSON (camelCase) para consumo no worker Python ML.
/// </summary>
public sealed record PrevisaoDemandaSolicitadaEvent(
    [property: JsonPropertyName("solicitacaoId")] Guid SolicitacaoId,
    [property: JsonPropertyName("restauranteId")] Guid RestauranteId,
    [property: JsonPropertyName("produtoId")] Guid ProdutoId,
    [property: JsonPropertyName("dataAlvo")] DateOnly DataAlvo,
    [property: JsonPropertyName("historicoVendasRecentes")] List<decimal> HistoricoVendasRecentes,
    [property: JsonPropertyName("temperaturaPrevista")] decimal TemperaturaPrevista,
    [property: JsonPropertyName("precipitacaoPrevista")] decimal PrecipitacaoPrevista
);
