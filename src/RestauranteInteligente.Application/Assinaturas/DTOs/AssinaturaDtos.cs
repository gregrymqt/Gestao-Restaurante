namespace RestauranteInteligente.Application.Assinaturas.DTOs;

public sealed record PlanoItemDto(
    Guid Id,
    string Nome,
    string Descricao,
    decimal PrecoMensal,
    bool PossuiModuloIa
);

public sealed record AssinaturaStatusOutputDto(
    Guid RestauranteId,
    string Status,
    DateTimeOffset DataInicio,
    DateTimeOffset DataFimTrial,
    DateTimeOffset? DataExpiracao,
    int DiasRestantesTrial,
    bool EstaVigente,
    PlanoItemDto? PlanoAtual,
    IReadOnlyList<PlanoItemDto> PlanosDisponiveis
);

public sealed record AtivarPlanoInputDto(
    Guid PlanoId,
    int MesesVigencia = 1
);
