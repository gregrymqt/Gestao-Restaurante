namespace RestauranteInteligente.Application.Caixa.DTOs;

public sealed record AbrirCaixaOutputDto(
    Guid FechamentoCaixaId,
    Guid RestauranteId,
    Guid UsuarioId,
    DateTimeOffset DataAbertura,
    string Status
);
