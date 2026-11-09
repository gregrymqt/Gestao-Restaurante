namespace RestauranteInteligente.Application.Previsoes.DTOs;

/// <summary>
/// DTO de saída retornado após o disparo de solicitação de previsão de demanda sob demanda.
/// </summary>
public sealed record SolicitarPrevisaoDemandaOutputDto(
    Guid CorrelationId,
    Guid RestauranteId,
    DateOnly DataAlvo,
    int TotalProdutosSolicitados,
    decimal TemperaturaPrevista,
    decimal PrecipitacaoPrevista,
    string Status,
    string Mensagem
);
