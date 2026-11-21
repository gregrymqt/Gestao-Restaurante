namespace RestauranteInteligente.Application.Previsoes.DTOs;

public sealed record ItemOrdemCompraInputDto(
    Guid InsumoId,
    decimal Quantidade,
    decimal? PrecoUnitarioEstimado = null
);

public sealed record CriarOrdemCompraInputDto(
    IReadOnlyList<ItemOrdemCompraInputDto> Itens,
    decimal? ValorTotal = null
);

public sealed record OrdemCompraOutputDto(
    Guid Id,
    string Protocolo,
    string Status,
    decimal ValorTotal,
    DateTimeOffset CriadoEm,
    bool Sucesso = true
);
