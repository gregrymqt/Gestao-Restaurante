namespace RestauranteInteligente.Application.Vendas.DTOs;

public sealed record ItemVendaInputDto(
    Guid ProdutoId,
    decimal Quantidade,
    IReadOnlyList<ItemVendaModificadorInputDto>? Modificadores = null
);

public sealed record RegistrarVendaInputDto(
    string FormaPagamento,
    IReadOnlyList<ItemVendaInputDto> Itens
);
