using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Assinaturas.DTOs;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Assinaturas.UseCases;

/// <summary>
/// Consulta o status de vigência, período de trial e planos disponíveis para o inquilino atual.
/// </summary>
public sealed class ObterStatusAssinaturaUseCase
{
    private readonly ITenantContext _tenantContext;
    private readonly IAssinaturaRepository _assinaturaRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ObterStatusAssinaturaUseCase> _logger;

    public ObterStatusAssinaturaUseCase(
        ITenantContext tenantContext,
        IAssinaturaRepository assinaturaRepository,
        IUnitOfWork unitOfWork,
        ILogger<ObterStatusAssinaturaUseCase> logger)
    {
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _assinaturaRepository = assinaturaRepository ?? throw new ArgumentNullException(nameof(assinaturaRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<AssinaturaStatusOutputDto> ExecutarAsync(CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var restauranteId = _tenantContext.RestauranteId;
        var assinatura = await _assinaturaRepository.ObterPorRestauranteIdAsync(restauranteId, ct);

        // Se o inquilino não possuir assinatura registrada (retrocompatibilidade), cria uma de Trial 14 dias
        if (assinatura == null)
        {
            assinatura = new Assinatura(
                id: Guid.NewGuid(),
                restauranteId: restauranteId,
                dataInicio: DateTimeOffset.UtcNow,
                dataFimTrial: DateTimeOffset.UtcNow.AddDays(14)
            );
            await _assinaturaRepository.AdicionarAsync(assinatura, ct);
            await _unitOfWork.CommitAsync(ct);
            _logger.LogInformation("Assinatura de Free Trial inicializada automaticamente para inquilino existente {TenantId}.", restauranteId);
        }

        var planos = await _assinaturaRepository.ObterPlanosAtivosAsync(ct);
        var planosDto = planos.Select(p => new PlanoItemDto(
            p.Id,
            p.Nome,
            p.Descricao,
            p.PrecoMensal,
            p.PossuiModuloIa
        )).ToList();

        PlanoItemDto? planoAtualDto = null;
        if (assinatura.PlanoId.HasValue)
        {
            var plano = planos.FirstOrDefault(p => p.Id == assinatura.PlanoId.Value)
                     ?? await _assinaturaRepository.ObterPlanoPorIdAsync(assinatura.PlanoId.Value, ct);

            if (plano != null)
            {
                planoAtualDto = new PlanoItemDto(
                    plano.Id,
                    plano.Nome,
                    plano.Descricao,
                    plano.PrecoMensal,
                    plano.PossuiModuloIa
                );
            }
        }

        return new AssinaturaStatusOutputDto(
            RestauranteId: restauranteId,
            Status: assinatura.Status.ToString().ToUpperInvariant(),
            DataInicio: assinatura.DataInicio,
            DataFimTrial: assinatura.DataFimTrial,
            DataExpiracao: assinatura.DataExpiracao,
            DiasRestantesTrial: assinatura.DiasRestantesTrial(),
            EstaVigente: assinatura.EstaVigente(),
            PlanoAtual: planoAtualDto,
            PlanosDisponiveis: planosDto
        );
    }
}
