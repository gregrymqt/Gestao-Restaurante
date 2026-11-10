namespace RestauranteInteligente.Application.Vendas.DTOs;

public sealed record VendaHistoricoItemDto(
    Guid Id,
    Guid ProdutoId,
    string NomeProduto,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal Subtotal,
    string? ModificadoresJson = null
);

public sealed record VendaHistoricoDto(
    Guid VendaId,
    Guid RestauranteId,
    Guid? FechamentoCaixaId,
    DateTimeOffset DataHora,
    string Status,
    string FormaPagamento,
    decimal ValorTotal,
    int QuantidadeItens,
    IReadOnlyList<VendaHistoricoItemDto> Itens,
    string StatusPreparo = "RECEBIDO"
);
