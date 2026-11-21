namespace RestauranteInteligente.Api.DTOs.Caixa;

public sealed record RegistrarMovimentacaoApiRequestDto(
    decimal Valor,
    string? Motivo = null
);
