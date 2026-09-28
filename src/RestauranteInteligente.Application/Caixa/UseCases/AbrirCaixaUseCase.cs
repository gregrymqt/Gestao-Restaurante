using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Caixa.DTOs;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Caixa.UseCases;

/// <summary>
/// Caso de uso atômico de abertura de turno de caixa operacional com ativação de contexto multi-tenant.
/// </summary>
public sealed class AbrirCaixaUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFechamentoCaixaRepository _fechamentoCaixaRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<AbrirCaixaUseCase> _logger;

    public AbrirCaixaUseCase(
        IUnitOfWork unitOfWork,
        IFechamentoCaixaRepository fechamentoCaixaRepository,
        ITenantContext tenantContext,
        ILogger<AbrirCaixaUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _fechamentoCaixaRepository = fechamentoCaixaRepository ?? throw new ArgumentNullException(nameof(fechamentoCaixaRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<AbrirCaixaOutputDto> ExecutarAsync(Guid usuarioId, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        if (usuarioId == Guid.Empty)
            throw new ArgumentException("Identificador do usuário operador é obrigatório.", nameof(usuarioId));

        var tenantId = _tenantContext.RestauranteId;

        var caixaAberto = await _fechamentoCaixaRepository.ObterCaixaAbertoAsync(ct);
        if (caixaAberto != null)
        {
            _logger.LogInformation("Turno de caixa já aberto localizado: {CaixaId} no restaurante {TenantId}.",
                caixaAberto.Id, tenantId);
            return new AbrirCaixaOutputDto(
                caixaAberto.Id,
                caixaAberto.RestauranteId,
                caixaAberto.UsuarioId,
                caixaAberto.DataAbertura,
                caixaAberto.Status
            );
        }

        var novoCaixa = new FechamentoCaixa(
            id: Guid.NewGuid(),
            restauranteId: tenantId,
            usuarioId: usuarioId,
            dataAbertura: DateTimeOffset.UtcNow
        );

        await _fechamentoCaixaRepository.AdicionarAsync(novoCaixa, ct);
        await _unitOfWork.CommitAsync(ct);

        _logger.LogInformation("Novo turno de caixa {CaixaId} aberto para o operador {UsuarioId} no restaurante {TenantId}.",
            novoCaixa.Id, usuarioId, tenantId);

        return new AbrirCaixaOutputDto(
            novoCaixa.Id,
            novoCaixa.RestauranteId,
            novoCaixa.UsuarioId,
            novoCaixa.DataAbertura,
            novoCaixa.Status
        );
    }
}
