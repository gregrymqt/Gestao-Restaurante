namespace RestauranteInteligente.Application.Previsoes.DTOs;

public sealed record ItemOrdemCompraDetalheDto(
    Guid Id,
    Guid InsumoId,
    string NomeInsumo,
    string UnidadeMedida,
    decimal Quantidade,
    decimal PrecoUnitarioEstimado,
    decimal SubtotalEstimado
);

public sealed record OrdemCompraDetalheDto(
    Guid Id,
    string Protocolo,
    string Status,
    decimal ValorTotalEstimado,
    string? Fornecedor,
    string? Observacao,
    DateTimeOffset CriadoEm,
    DateTimeOffset? AtualizadoEm,
    IReadOnlyList<ItemOrdemCompraDetalheDto> Itens
);

public sealed record AtualizarStatusOrdemCompraInputDto(
    string NovoStatus,
    string? Fornecedor = null,
    string? Observacao = null
);

public sealed record ReceberOrdemCompraOutputDto(
    Guid OrdemCompraId,
    string Protocolo,
    string Status,
    int TotalItensCreditados,
    DateTimeOffset DataHoraRecebimento,
    string Mensagem
);
