using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Caixa.DTOs;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Caixa.UseCases;

/// <summary>
/// Caso de uso para registrar movimentações de suprimento ou sangria de dinheiro na sessão de caixa ativa.
/// </summary>
public sealed class RegistrarMovimentacaoCaixaUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFechamentoCaixaRepository _fechamentoCaixaRepository;
    private readonly IVendaRepository _vendaRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<RegistrarMovimentacaoCaixaUseCase> _logger;

    public RegistrarMovimentacaoCaixaUseCase(
        IUnitOfWork unitOfWork,
        IFechamentoCaixaRepository fechamentoCaixaRepository,
        IVendaRepository vendaRepository,
        ITenantContext tenantContext,
        ILogger<RegistrarMovimentacaoCaixaUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _fechamentoCaixaRepository = fechamentoCaixaRepository ?? throw new ArgumentNullException(nameof(fechamentoCaixaRepository));
        _vendaRepository = vendaRepository ?? throw new ArgumentNullException(nameof(vendaRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<MovimentacaoCaixaOutputDto> ExecutarAsync(
        Guid usuarioId,
        RegistrarMovimentacaoInputDto input,
        CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var tenantId = _tenantContext.RestauranteId;

        // 1. Localiza a sessão de caixa operacional aberta
        var caixaAberto = await _fechamentoCaixaRepository.ObterCaixaAbertoAsync(ct);
        if (caixaAberto == null)
            throw new InvalidOperationException("Não há sessão de caixa operacional aberta no momento.");

        var idResponsavel = usuarioId != Guid.Empty ? usuarioId : caixaAberto.UsuarioId;
        var tipoNormalizado = input.Tipo?.Trim().ToUpperInvariant() ?? string.Empty;

        if (tipoNormalizado != MovimentacaoCaixa.TipoSuprimento && tipoNormalizado != MovimentacaoCaixa.TipoSangria)
            throw new ArgumentException($"Tipo de movimentação inválido: '{input.Tipo}'. Esperado '{MovimentacaoCaixa.TipoSuprimento}' ou '{MovimentacaoCaixa.TipoSangria}'.", nameof(input.Tipo));

        if (input.Valor <= 0m)
            throw new ArgumentException("O valor da movimentação deve ser estritamente maior que zero.", nameof(input.Valor));

        // 2. Apuração do saldo físico atual em dinheiro na gaveta
        var vendas = await _vendaRepository.ObterVendasPorFechamentoCaixaIdAsync(caixaAberto.Id, ct);
        var totalDinheiroVendas = vendas
            .Where(v => v.FormaPagamento.Equals("DINHEIRO", StringComparison.OrdinalIgnoreCase))
            .Sum(v => v.ValorTotal);

        var movimentacoesExistentes = await _fechamentoCaixaRepository.ObterMovimentacoesPorCaixaIdAsync(caixaAberto.Id, ct);
        var totalSuprimentos = movimentacoesExistentes
            .Where(m => m.Tipo == MovimentacaoCaixa.TipoSuprimento)
            .Sum(m => m.Valor);

        var totalSangrias = movimentacoesExistentes
            .Where(m => m.Tipo == MovimentacaoCaixa.TipoSangria)
            .Sum(m => m.Valor);

        var saldoDinheiroAtual = totalDinheiroVendas + totalSuprimentos - totalSangrias;

        // 3. Invariante inegociável de sangria: rejeitar se saldo físico insuficiente
        if (tipoNormalizado == MovimentacaoCaixa.TipoSangria && input.Valor > saldoDinheiroAtual)
        {
            throw new InvalidOperationException(
                $"Saldo em dinheiro insuficiente na gaveta para sangria. Saldo disponível: R$ {saldoDinheiroAtual:N2}, solicitado: R$ {input.Valor:N2}.");
        }

        // 4. Cria e persiste a movimentação
        var dataHora = DateTimeOffset.UtcNow;
        var movimentacao = new MovimentacaoCaixa(
            id: Guid.NewGuid(),
            restauranteId: tenantId,
            fechamentoCaixaId: caixaAberto.Id,
            usuarioId: idResponsavel,
            tipo: tipoNormalizado,
            valor: input.Valor,
            motivo: input.Motivo,
            dataHora: dataHora
        );

        await _fechamentoCaixaRepository.AdicionarMovimentacaoAsync(movimentacao, ct);
        await _unitOfWork.CommitAsync(ct);

        var prefixo = tipoNormalizado == MovimentacaoCaixa.TipoSuprimento ? "SUP" : "SAN";
        var protocolo = $"{prefixo}-{movimentacao.Id.ToString()[..8].ToUpperInvariant()}";
        var novoSaldo = tipoNormalizado == MovimentacaoCaixa.TipoSuprimento
            ? saldoDinheiroAtual + input.Valor
            : saldoDinheiroAtual - input.Valor;

        var rotulo = tipoNormalizado == MovimentacaoCaixa.TipoSuprimento ? "Suprimento de troco" : "Sangria de caixa";
        var mensagem = $"{rotulo} registrado com sucesso sob protocolo {protocolo}.";

        _logger.LogInformation(
            "Movimentação {Tipo} de R$ {Valor:N2} registrada no caixa {CaixaId} (Protocolo: {Protocolo}). Novo saldo: R$ {NovoSaldo:N2}.",
            tipoNormalizado, input.Valor, caixaAberto.Id, protocolo, novoSaldo);

        return new MovimentacaoCaixaOutputDto(
            Id: movimentacao.Id,
            Tipo: tipoNormalizado,
            Valor: input.Valor,
            Motivo: input.Motivo,
            SaldoAtualDinheiro: novoSaldo,
            Protocolo: protocolo,
            DataHora: dataHora,
            Sucesso: true,
            Mensagem: mensagem
        );
    }
}
