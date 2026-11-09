namespace RestauranteInteligente.Application.Dashboard.DTOs;

public sealed record DashboardKpisDto(
    decimal TotalFaturadoDia,
    int QuantidadePedidos,
    decimal TicketMedio,
    decimal PercentualMeta,
    decimal FaturamentoOntem
);

public sealed record DistribuicaoPagamentoDto(
    string Tipo,
    string Nome,
    decimal Valor,
    decimal Percentual,
    int QuantidadeTransacoes
);

public sealed record InsumoCriticoDashboardDto(
    Guid Id,
    string Nome,
    decimal QuantidadeAtual,
    decimal QuantidadeMinima,
    string UnidadeMedida
);

public sealed record PrevisaoIaDashboardDto(
    string DataAlvoFormatada,
    int TotalItensPrevistos,
    decimal VariacaoPercentual,
    string CondicaoClimaPrevista,
    string ProdutoDestaque
);

public sealed record ResumoDashboardDto(
    string StatusLoja,
    string TurnoAtual,
    DashboardKpisDto Kpis,
    IReadOnlyList<DistribuicaoPagamentoDto> Pagamentos,
    IReadOnlyList<InsumoCriticoDashboardDto> InsumosCriticos,
    PrevisaoIaDashboardDto PrevisaoIa
);
