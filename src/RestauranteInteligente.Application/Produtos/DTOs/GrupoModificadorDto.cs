namespace RestauranteInteligente.Application.Produtos.DTOs;

public sealed record OpcaoModificadorDto(
    Guid Id,
    string Nome,
    decimal PrecoAdicional,
    Guid? InsumoId,
    decimal QuantidadeInsumo,
    string TipoAcao
);

public sealed record GrupoModificadorDto(
    Guid Id,
    string Nome,
    string? Descricao,
    bool Obrigatorio,
    int MinimoSelecoes,
    int MaximoSelecoes,
    IReadOnlyList<OpcaoModificadorDto> Opcoes
);
