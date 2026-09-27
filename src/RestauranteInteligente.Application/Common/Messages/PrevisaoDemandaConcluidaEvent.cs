using System.Text.Json.Serialization;

namespace RestauranteInteligente.Application.Common.Messages;

/// <summary>
/// Evento emitido pelo worker Python ML após inferência de previsão de demanda concluída.
/// Consumido pelo backend C# para persistência na tabela Previsoes.
/// </summary>
public sealed record PrevisaoDemandaConcluidaEvent(
    [property: JsonPropertyName("solicitacaoId")] Guid SolicitacaoId,
    [property: JsonPropertyName("restauranteId")] Guid RestauranteId,
    [property: JsonPropertyName("produtoId")] Guid ProdutoId,
    [property: JsonPropertyName("dataAlvo")] DateOnly DataAlvo,
    [property: JsonPropertyName("quantidadePrevista")] decimal QuantidadePrevista,
    [property: JsonPropertyName("modeloVersao")] string ModeloVersao
);
