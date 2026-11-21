using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Caixa.DTOs;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Caixa.UseCases;

/// <summary>
/// Caso de uso para obter o resumo consolidado do turno operacional atual para o gestor.
/// </summary>
public sealed class ObterResumoTurnoUseCase
{
    private readonly IFechamentoCaixaRepository _fechamentoCaixaRepository;
    private readonly IVendaRepository _vendaRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ObterResumoTurnoUseCase> _logger;

    public ObterResumoTurnoUseCase(
        IFechamentoCaixaRepository fechamentoCaixaRepository,
        IVendaRepository vendaRepository,
        ITenantContext tenantContext,
        ILogger<ObterResumoTurnoUseCase> logger)
    {
        _fechamentoCaixaRepository = fechamentoCaixaRepository ?? throw new ArgumentNullException(nameof(fechamentoCaixaRepository));
        _vendaRepository = vendaRepository ?? throw new ArgumentNullException(nameof(vendaRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ResumoTurnoOutputDto> ExecutarAsync(CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var caixaAberto = await _fechamentoCaixaRepository.ObterCaixaAbertoAsync(ct);
        if (caixaAberto == null)
            throw new InvalidOperationException("Não há sessão de caixa operacional aberta no momento.");

        var vendas = await _vendaRepository.ObterVendasPorFechamentoCaixaIdAsync(caixaAberto.Id, ct);
        var totalVendas = vendas.Count;
        var volumeTotal = vendas.Sum(v => v.ValorTotal);
        var ticketMedio = totalVendas > 0 ? Math.Round(volumeTotal / totalVendas, 2, MidpointRounding.AwayFromZero) : 0m;

        // Breakdown de meios de pagamento
        decimal pix = 0m;
        decimal cartao = 0m;
        decimal dinheiroVendas = 0m;

        foreach (var venda in vendas)
        {
            var forma = venda.FormaPagamento.Trim().ToUpperInvariant();
            if (forma == "PIX")
            {
                pix += venda.ValorTotal;
            }
            else if (forma == "DINHEIRO")
            {
                dinheiroVendas += venda.ValorTotal;
            }
            else
            {
                // Cartão de Crédito, Débito, Voucher etc.
                cartao += venda.ValorTotal;
            }
        }

        // Movimentações avulsas de dinheiro
        var movimentacoes = await _fechamentoCaixaRepository.ObterMovimentacoesPorCaixaIdAsync(caixaAberto.Id, ct);
        var suprimentos = movimentacoes.Where(m => m.Tipo == MovimentacaoCaixa.TipoSuprimento).Sum(m => m.Valor);
        var sangrias = movimentacoes.Where(m => m.Tipo == MovimentacaoCaixa.TipoSangria).Sum(m => m.Valor);
        var saldoDinheiroGaveta = dinheiroVendas + suprimentos - sangrias;

        // Formatação temporal e métricas de turno
        var diff = DateTimeOffset.UtcNow - caixaAberto.DataAbertura;
        var horas = (int)diff.TotalHours;
        var minutos = diff.Minutes;
        var tempoDecorrido = horas > 0 ? $"Há {horas}h {minutos}m" : $"Há {minutos}m";
        var inicioTurno = caixaAberto.DataAbertura.ToString("HH:mm");
        var turnoNumero = $"#{caixaAberto.Id.ToString()[..4].ToUpperInvariant()}";

        return new ResumoTurnoOutputDto(
            TurnoNumero: turnoNumero,
            InicioTurno: inicioTurno,
            TempoDecorrido: tempoDecorrido,
            TotalVendas: totalVendas,
            TicketMedio: ticketMedio,
            VolumeTotal: volumeTotal,
            SaldoDinheiroGaveta: saldoDinheiroGaveta,
            TenderBreakdown: new TenderBreakdownDto(
                Pix: pix,
                Cartao: cartao,
                Dinheiro: dinheiroVendas
            ),
            TendenciaPercentual: 0m
        );
    }
}
