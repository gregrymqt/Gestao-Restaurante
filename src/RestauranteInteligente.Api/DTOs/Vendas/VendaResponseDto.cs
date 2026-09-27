namespace RestauranteInteligente.Api.DTOs.Vendas;

public sealed record ItemVendaResponseDto(
    Guid Id,
    Guid ProdutoId,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal Subtotal
);

public sealed record VendaResponseDto(
    Guid VendaId,
    Guid RestauranteId,
    Guid FechamentoCaixaId,
    DateTimeOffset DataHora,
    string Status,
    string FormaPagamento,
    decimal ValorTotal,
    IReadOnlyList<ItemVendaResponseDto> Itens
);
