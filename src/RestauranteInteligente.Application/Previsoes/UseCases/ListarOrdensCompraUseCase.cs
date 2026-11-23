using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Previsoes.UseCases;

/// <summary>
/// Caso de uso para listar ordens de compra do restaurante autenticado.
/// </summary>
public sealed class ListarOrdensCompraUseCase
{
    private readonly IOrdemCompraRepository _ordemCompraRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ListarOrdensCompraUseCase> _logger;

    public ListarOrdensCompraUseCase(
        IOrdemCompraRepository ordemCompraRepository,
        ITenantContext tenantContext,
        ILogger<ListarOrdensCompraUseCase> logger)
    {
        _ordemCompraRepository = ordemCompraRepository ?? throw new ArgumentNullException(nameof(ordemCompraRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<OrdemCompraDetalheDto>> ExecutarAsync(string? status = null, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var ordens = await _ordemCompraRepository.ListarAsync(status, ct);

        return ordens.Select(o => new OrdemCompraDetalheDto(
            Id: o.Id,
            Protocolo: o.Protocolo,
            Status: o.Status,
            ValorTotalEstimado: o.ValorTotalEstimado,
            Fornecedor: o.Fornecedor,
            Observacao: o.Observacao,
            CriadoEm: o.CriadoEm,
            AtualizadoEm: o.AtualizadoEm,
            Itens: o.Itens.Select(i => new ItemOrdemCompraDetalheDto(
                Id: i.Id,
                InsumoId: i.InsumoId,
                NomeInsumo: i.Insumo?.Nome ?? "Insumo",
                UnidadeMedida: i.Insumo?.UnidadeMedida ?? "UN",
                Quantidade: i.Quantidade,
                PrecoUnitarioEstimado: i.PrecoUnitarioEstimado,
                SubtotalEstimado: i.SubtotalEstimado
            )).ToList()
        )).ToList();
    }
}
