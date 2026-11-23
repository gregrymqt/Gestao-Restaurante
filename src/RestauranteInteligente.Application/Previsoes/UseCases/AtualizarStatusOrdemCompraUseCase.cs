using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Previsoes.UseCases;

/// <summary>
/// Caso de uso para transição de status de ordens de compra (Aprovação/Compra e Cancelamento).
/// </summary>
public sealed class AtualizarStatusOrdemCompraUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrdemCompraRepository _ordemCompraRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<AtualizarStatusOrdemCompraUseCase> _logger;

    public AtualizarStatusOrdemCompraUseCase(
        IUnitOfWork unitOfWork,
        IOrdemCompraRepository ordemCompraRepository,
        ITenantContext tenantContext,
        ILogger<AtualizarStatusOrdemCompraUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _ordemCompraRepository = ordemCompraRepository ?? throw new ArgumentNullException(nameof(ordemCompraRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<OrdemCompraDetalheDto> ExecutarAsync(Guid ordemId, AtualizarStatusOrdemCompraInputDto input, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        if (ordemId == Guid.Empty)
            throw new ArgumentException("Identificador da ordem de compra inválido.", nameof(ordemId));

        if (string.IsNullOrWhiteSpace(input.NovoStatus))
            throw new ArgumentException("O novo status é obrigatório.", nameof(input.NovoStatus));

        var ordem = await _ordemCompraRepository.ObterParaAtualizacaoAsync(ordemId, ct);
        if (ordem == null)
            throw new KeyNotFoundException($"Ordem de compra {ordemId} não encontrada para este restaurante.");

        var statusAlvo = input.NovoStatus.Trim().ToUpperInvariant();
        switch (statusAlvo)
        {
            case OrdemCompra.StatusAprovada:
                ordem.Aprovar(input.Fornecedor, input.Observacao);
                break;
            case OrdemCompra.StatusCancelada:
                ordem.Cancelar(input.Observacao);
                break;
            default:
                throw new ArgumentException($"Transição para status '{statusAlvo}' não permitida via endpoint de atualização simples.");
        }

        await _unitOfWork.CommitAsync(ct);

        _logger.LogInformation("Ordem de compra {Protocolo} atualizada para {Status}. Fornecedor: {Fornecedor}",
            ordem.Protocolo, ordem.Status, ordem.Fornecedor ?? "N/A");

        return new OrdemCompraDetalheDto(
            Id: ordem.Id,
            Protocolo: ordem.Protocolo,
            Status: ordem.Status,
            ValorTotalEstimado: ordem.ValorTotalEstimado,
            Fornecedor: ordem.Fornecedor,
            Observacao: ordem.Observacao,
            CriadoEm: ordem.CriadoEm,
            AtualizadoEm: ordem.AtualizadoEm,
            Itens: ordem.Itens.Select(i => new ItemOrdemCompraDetalheDto(
                Id: i.Id,
                InsumoId: i.InsumoId,
                NomeInsumo: i.Insumo?.Nome ?? "Insumo",
                UnidadeMedida: i.Insumo?.UnidadeMedida ?? "UN",
                Quantidade: i.Quantidade,
                PrecoUnitarioEstimado: i.PrecoUnitarioEstimado,
                SubtotalEstimado: i.SubtotalEstimado
            )).ToList()
        );
    }
}
