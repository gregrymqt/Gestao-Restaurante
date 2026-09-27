namespace RestauranteInteligente.Application.Vendas.DTOs;

public sealed record ItemVendaOutputDto(
    Guid Id,
    Guid ProdutoId,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal Subtotal
);

public sealed record RegistrarVendaOutputDto(
    Guid VendaId,
    Guid RestauranteId,
    Guid FechamentoCaixaId,
    DateTimeOffset DataHora,
    string Status,
    string FormaPagamento,
    decimal ValorTotal,
    IReadOnlyList<ItemVendaOutputDto> Itens
);
