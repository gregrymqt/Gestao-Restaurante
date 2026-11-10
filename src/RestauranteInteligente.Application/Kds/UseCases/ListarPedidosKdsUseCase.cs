using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Kds.DTOs;
using RestauranteInteligente.Application.Kds.Mappers;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Kds.UseCases;

/// <summary>
/// Caso de uso que lista os pedidos ativos na fila operacional da cozinha (KDS) em ordem cronológica (FIFO).
/// </summary>
public sealed class ListarPedidosKdsUseCase
{
    private readonly IVendaRepository _vendaRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ListarPedidosKdsUseCase> _logger;

    public ListarPedidosKdsUseCase(
        IVendaRepository vendaRepository,
        ITenantContext tenantContext,
        ILogger<ListarPedidosKdsUseCase> logger)
    {
        _vendaRepository = vendaRepository ?? throw new ArgumentNullException(nameof(vendaRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<PedidoKdsDto>> ExecutarAsync(CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Contexto de restaurante (Tenant) não inicializado.");

        var vendas = await _vendaRepository.ObterPedidosAtivosKdsAsync(ct);

        _logger.LogDebug("Consultados {Quantidade} pedidos ativos para o KDS do restaurante {TenantId}.",
            vendas.Count, _tenantContext.RestauranteId);

        return vendas.Select(KdsPedidoMapper.MapearParaDto).ToList();
    }
}
