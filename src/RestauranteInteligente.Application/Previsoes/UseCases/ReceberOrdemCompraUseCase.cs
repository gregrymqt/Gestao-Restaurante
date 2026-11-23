using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Domain.Enums;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Previsoes.UseCases;

/// <summary>
/// Caso de uso atômico para receber mercadorias de uma ordem de compra,
/// creditando estoque físico via ledger imutável e transação anti-deadlock.
/// </summary>
public sealed class ReceberOrdemCompraUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrdemCompraRepository _ordemCompraRepository;
    private readonly IInsumoRepository _insumoRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ReceberOrdemCompraUseCase> _logger;

    public ReceberOrdemCompraUseCase(
        IUnitOfWork unitOfWork,
        IOrdemCompraRepository ordemCompraRepository,
        IInsumoRepository insumoRepository,
        ITenantContext tenantContext,
        ILogger<ReceberOrdemCompraUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _ordemCompraRepository = ordemCompraRepository ?? throw new ArgumentNullException(nameof(ordemCompraRepository));
        _insumoRepository = insumoRepository ?? throw new ArgumentNullException(nameof(insumoRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ReceberOrdemCompraOutputDto> ExecutarAsync(Guid ordemId, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        if (ordemId == Guid.Empty)
            throw new ArgumentException("Identificador da ordem de compra inválido.", nameof(ordemId));

        var ordem = await _ordemCompraRepository.ObterParaAtualizacaoAsync(ordemId, ct);
        if (ordem == null)
            throw new KeyNotFoundException($"Ordem de compra {ordemId} não encontrada para este restaurante.");

        if (ordem.Status == OrdemCompra.StatusRecebida)
            throw new InvalidOperationException($"A ordem de compra {ordem.Protocolo} já foi recebida anteriormente.");

        if (ordem.Status == OrdemCompra.StatusCancelada)
            throw new InvalidOperationException($"A ordem de compra {ordem.Protocolo} está cancelada e não pode ser recebida.");

        if (ordem.Itens.Count == 0)
            throw new InvalidOperationException($"A ordem de compra {ordem.Protocolo} não contém itens para entrada no estoque.");

        // Inicia transação explícita
        await using var tx = await _unitOfWork.BeginTransactionAsync(ct);

        // Anti-deadlock: Ordenação determinística de InsumoId ASC
        var insumoIds = ordem.Itens
            .Select(i => i.InsumoId)
            .Distinct()
            .OrderBy(id => id)
            .ToList();

        var insumosNoBanco = await _insumoRepository.ObterPorIdsParaAtualizacaoAsync(insumoIds, ct);
        var mapaInsumos = insumosNoBanco.ToDictionary(i => i.Id);

        var dataHora = DateTimeOffset.UtcNow;
        var totalCreditados = 0;

        foreach (var item in ordem.Itens)
        {
            if (!mapaInsumos.TryGetValue(item.InsumoId, out var insumo))
            {
                await tx.RollbackAsync(ct);
                throw new KeyNotFoundException($"Insumo {item.InsumoId} não encontrado no estoque do restaurante.");
            }

            // Credita visão materializada
            insumo.CreditarEstoque(item.Quantidade);

            // Grava no ledger imutável
            var movimentacao = new MovimentacaoEstoque(
                id: Guid.NewGuid(),
                restauranteId: _tenantContext.RestauranteId,
                insumoId: insumo.Id,
                tipo: TipoMovimentacao.Entrada,
                origem: OrigemMovimentacao.Compra,
                quantidade: item.Quantidade,
                dataHora: dataHora,
                observacao: $"Recebimento OC {ordem.Protocolo}{(string.IsNullOrWhiteSpace(ordem.Fornecedor) ? "" : $" - Fornecedor: {ordem.Fornecedor}")}"
            );

            await _insumoRepository.AdicionarMovimentacaoAsync(movimentacao, ct);
            totalCreditados++;
        }

        // Atualiza status da ordem de compra
        ordem.MarcarRecebida();

        await _unitOfWork.CommitAsync(ct);
        await tx.CommitAsync(ct);

        _logger.LogInformation("Ordem de compra {Protocolo} recebida com sucesso. {TotalItens} itens creditados no estoque físico.",
            ordem.Protocolo, totalCreditados);

        return new ReceberOrdemCompraOutputDto(
            OrdemCompraId: ordem.Id,
            Protocolo: ordem.Protocolo,
            Status: ordem.Status,
            TotalItensCreditados: totalCreditados,
            DataHoraRecebimento: dataHora,
            Mensagem: $"Mercadoria recebida com sucesso. {totalCreditados} insumos creditados no livro-razão de estoque."
        );
    }
}
