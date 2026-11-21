namespace RestauranteInteligente.Application.Caixa.DTOs;

public sealed record RegistrarMovimentacaoInputDto(
    string Tipo,
    decimal Valor,
    string Motivo
);

public sealed record MovimentacaoCaixaOutputDto(
    Guid Id,
    string Tipo,
    decimal Valor,
    string Motivo,
    decimal SaldoAtualDinheiro,
    string Protocolo,
    DateTimeOffset DataHora,
    bool Sucesso = true,
    string Mensagem = ""
);

public sealed record TenderBreakdownDto(
    decimal Pix,
    decimal Cartao,
    decimal Dinheiro
);

public sealed record ResumoTurnoOutputDto(
    string TurnoNumero,
    string InicioTurno,
    string TempoDecorrido,
    int TotalVendas,
    decimal TicketMedio,
    decimal VolumeTotal,
    decimal SaldoDinheiroGaveta,
    TenderBreakdownDto TenderBreakdown,
    decimal TendenciaPercentual = 0m
);
