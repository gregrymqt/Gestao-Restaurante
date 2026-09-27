namespace RestauranteInteligente.Application.Vendas.DTOs;

public sealed record ItemVendaInputDto(
    Guid ProdutoId,
    decimal Quantidade
);

public sealed record RegistrarVendaInputDto(
    string FormaPagamento,
    IReadOnlyList<ItemVendaInputDto> Itens
);
