namespace RestauranteInteligente.Application.Admin.DTOs;

public sealed record TenantAdminItemDto(
    Guid RestauranteId,
    string NomeRestaurante,
    string Cnpj,
    string Cidade,
    string Estado,
    DateTimeOffset DataCadastro,
    string GestorNome,
    string GestorEmail,
    string StatusAssinatura,
    int DiasRestantesTrial,
    DateTimeOffset DataFimTrial,
    DateTimeOffset? DataExpiracao,
    string PlanoNome,
    decimal PrecoMensal
);

public sealed record EstenderTrialInputDto(
    int DiasAdicionais
);

public sealed record AlterarStatusAssinaturaInputDto(
    string NovoStatus,
    Guid? PlanoId
);
