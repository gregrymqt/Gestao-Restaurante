namespace RestauranteInteligente.Application.Caixa.DTOs;

public sealed record FecharCaixaOutputDto(
    Guid FechamentoCaixaId,
    Guid RestauranteId,
    DateTimeOffset DataAbertura,
    DateTimeOffset DataFechamento,
    decimal ValorTotalVendas,
    int QuantidadeVendas,
    string Status,
    Guid CorrelationId
);
