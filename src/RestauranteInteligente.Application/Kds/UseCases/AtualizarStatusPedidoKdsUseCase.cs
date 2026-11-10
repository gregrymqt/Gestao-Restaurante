using System.Text.Json;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Kds.DTOs;
using RestauranteInteligente.Application.Kds.Mappers;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Kds.UseCases;

/// <summary>
/// Caso de uso responsável por avançar o status operacional de um pedido na cozinha (KDS)
/// e notificar os terminais conectados via barramento SSE.
/// </summary>
public sealed class AtualizarStatusPedidoKdsUseCase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IVendaRepository _vendaRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenantContext;
    private readonly ISseEventStreamService _streamService;
    private readonly ILogger<AtualizarStatusPedidoKdsUseCase> _logger;

    public AtualizarStatusPedidoKdsUseCase(
        IVendaRepository vendaRepository,
        IUnitOfWork unitOfWork,
        ITenantContext tenantContext,
        ISseEventStreamService streamService,
        ILogger<AtualizarStatusPedidoKdsUseCase> logger)
    {
        _vendaRepository = vendaRepository ?? throw new ArgumentNullException(nameof(vendaRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _streamService = streamService ?? throw new ArgumentNullException(nameof(streamService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<PedidoKdsDto> ExecutarAsync(Guid vendaId, string novoStatusPreparo, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Contexto de restaurante (Tenant) não inicializado.");

        var tenantId = _tenantContext.RestauranteId;

        await using var transaction = await _unitOfWork.BeginTransactionAsync(ct);

        var venda = await _vendaRepository.ObterPorIdParaAtualizacaoAsync(vendaId, ct)
            ?? throw new KeyNotFoundException($"Pedido {vendaId} não encontrado para o restaurante atual.");

        venda.AtualizarStatusPreparo(novoStatusPreparo);
        await _unitOfWork.CommitAsync(ct);
        await transaction.CommitAsync(ct);

        var dto = KdsPedidoMapper.MapearParaDto(venda);

        try
        {
            var payload = JsonSerializer.Serialize(new
            {
                vendaId = dto.VendaId,
                codigoCurto = dto.CodigoCurto,
                statusPreparo = dto.StatusPreparo,
                atualizadoEm = DateTimeOffset.UtcNow
            }, JsonOptions);

            await _streamService.PublishAsync(
                tenantId,
                "PedidoStatusAtualizado",
                payload,
                Guid.NewGuid(),
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao publicar evento SSE PedidoStatusAtualizado para venda {VendaId}.", vendaId);
        }

        _logger.LogInformation("Pedido {VendaId} atualizado para status KDS '{StatusPreparo}' no restaurante {TenantId}.",
            vendaId, dto.StatusPreparo, tenantId);

        return dto;
    }
}
