using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Previsoes.UseCases;

/// <summary>
/// Caso de uso para registrar formalmente uma ordem de compra de insumos no banco relacional.
/// </summary>
public sealed class RegistrarOrdemCompraUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrdemCompraRepository _ordemCompraRepository;
    private readonly IInsumoRepository _insumoRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<RegistrarOrdemCompraUseCase> _logger;

    public RegistrarOrdemCompraUseCase(
        IUnitOfWork unitOfWork,
        IOrdemCompraRepository ordemCompraRepository,
        IInsumoRepository insumoRepository,
        ITenantContext tenantContext,
        ILogger<RegistrarOrdemCompraUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _ordemCompraRepository = ordemCompraRepository ?? throw new ArgumentNullException(nameof(ordemCompraRepository));
        _insumoRepository = insumoRepository ?? throw new ArgumentNullException(nameof(insumoRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<OrdemCompraOutputDto> ExecutarAsync(
        Guid usuarioId,
        CriarOrdemCompraInputDto input,
        CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        if (input.Itens == null || input.Itens.Count == 0)
            throw new ArgumentException("A ordem de compra deve conter ao menos um item de insumo.", nameof(input.Itens));

        var tenantId = _tenantContext.RestauranteId;
        var protocolo = $"OC-{DateTimeOffset.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpperInvariant()}";

        var ordemCompra = new OrdemCompra(
            id: Guid.NewGuid(),
            restauranteId: tenantId,
            protocolo: protocolo,
            usuarioId: usuarioId != Guid.Empty ? usuarioId : Guid.NewGuid(),
            criadoEm: DateTimeOffset.UtcNow,
            status: OrdemCompra.StatusPendente
        );

        foreach (var item in input.Itens)
        {
            if (item.InsumoId == Guid.Empty)
                throw new ArgumentException("Identificador do insumo inválido.", nameof(item.InsumoId));

            if (item.Quantidade <= 0m)
                throw new ArgumentException($"Quantidade inválida para o insumo {item.InsumoId}.", nameof(item.Quantidade));

            var precoUnitario = item.PrecoUnitarioEstimado ?? 0m;
            if (precoUnitario <= 0m)
            {
                var insumo = await _insumoRepository.ObterPorIdAsync(item.InsumoId, ct);
                if (insumo != null)
                {
                    precoUnitario = insumo.CustoUnitario;
                }
            }

            ordemCompra.AdicionarItem(item.InsumoId, item.Quantidade, precoUnitario);
        }

        await _ordemCompraRepository.AdicionarAsync(ordemCompra, ct);
        await _unitOfWork.CommitAsync(ct);

        _logger.LogInformation(
            "Ordem de Compra {Protocolo} registrada com sucesso no restaurante {TenantId}. Itens: {TotalItens}, Total Estimado: R$ {ValorTotal:N2}.",
            protocolo, tenantId, ordemCompra.Itens.Count, ordemCompra.ValorTotalEstimado);

        return new OrdemCompraOutputDto(
            Id: ordemCompra.Id,
            Protocolo: ordemCompra.Protocolo,
            Status: ordemCompra.Status,
            ValorTotal: ordemCompra.ValorTotalEstimado,
            CriadoEm: ordemCompra.CriadoEm,
            Sucesso: true
        );
    }
}
