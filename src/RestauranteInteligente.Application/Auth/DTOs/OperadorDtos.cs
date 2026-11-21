namespace RestauranteInteligente.Application.Auth.DTOs;

public sealed record CriarOperadorInputDto(
    string Nome,
    string? Email,
    string Role,
    string Pin
);

public sealed record OperadorResumoDto(
    Guid Id,
    string Nome,
    string? Email,
    string Role,
    string Iniciais,
    bool Ativo,
    bool PossuiPin
);

public sealed record LoginOperadorPinRequestDto(
    Guid RestauranteId,
    Guid UsuarioId,
    string Pin
);

public sealed record LoginOperadorPinResponseDto(
    string Token,
    string RefreshToken,
    Guid UsuarioId,
    string Nome,
    string Role,
    Guid RestauranteId
);
