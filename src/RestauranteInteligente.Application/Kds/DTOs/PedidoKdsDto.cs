namespace RestauranteInteligente.Application.Kds.DTOs;

public sealed record PedidoKdsModificadorDto(
    string Nome,
    string TipoAcao,
    decimal PrecoAdicional
);

public sealed record PedidoKdsItemDto(
    Guid Id,
    Guid ProdutoId,
    string NomeProduto,
    decimal Quantidade,
    IReadOnlyList<PedidoKdsModificadorDto> Modificadores
);

public sealed record PedidoKdsDto(
    Guid VendaId,
    string CodigoCurto,
    DateTimeOffset DataHora,
    string StatusPreparo,
    DateTimeOffset? PreparoIniciadoEm,
    DateTimeOffset? ProntoEm,
    IReadOnlyList<PedidoKdsItemDto> Itens
);
