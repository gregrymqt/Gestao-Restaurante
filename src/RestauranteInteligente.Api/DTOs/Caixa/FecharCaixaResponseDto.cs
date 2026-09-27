namespace RestauranteInteligente.Api.DTOs.Caixa;

public sealed record FecharCaixaResponseDto(
    Guid FechamentoCaixaId,
    Guid RestauranteId,
    DateTimeOffset DataAbertura,
    DateTimeOffset DataFechamento,
    decimal ValorTotalVendas,
    int QuantidadeVendas,
    string Status,
    Guid CorrelationId
);
