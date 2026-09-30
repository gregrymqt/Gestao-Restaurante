namespace RestauranteInteligente.Application.Auth.DTOs;

public sealed record CadastrarRestauranteInputDto(
    string NomeRestaurante,
    string Cnpj,
    string Cidade,
    string Estado,
    decimal Latitude,
    decimal Longitude,
    string NomeGestor,
    string EmailGestor,
    string SenhaGestor
);

public sealed record CadastrarRestauranteOutputDto(
    Guid RestauranteId,
    string NomeRestaurante,
    Guid UsuarioId,
    string NomeGestor,
    string Email,
    string Token,
    string RefreshToken,
    int DiasRestantesTrial,
    string StatusAssinatura
);
