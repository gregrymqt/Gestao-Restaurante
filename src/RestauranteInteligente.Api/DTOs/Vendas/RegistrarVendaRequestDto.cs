namespace RestauranteInteligente.Api.DTOs.Vendas;

public sealed record ItemVendaRequestDto(
    Guid ProdutoId,
    decimal Quantidade
);

public sealed record RegistrarVendaRequestDto(
    string FormaPagamento,
    List<ItemVendaRequestDto> Itens
);
