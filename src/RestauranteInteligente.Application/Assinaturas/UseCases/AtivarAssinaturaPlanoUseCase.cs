using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Assinaturas.DTOs;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Assinaturas.UseCases;

/// <summary>
/// Caso de uso de ativação de plano pós-trial ou renovação de assinatura SaaS para o inquilino.
/// </summary>
public sealed class AtivarAssinaturaPlanoUseCase
{
    private readonly ITenantContext _tenantContext;
    private readonly IAssinaturaRepository _assinaturaRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AtivarAssinaturaPlanoUseCase> _logger;

    public AtivarAssinaturaPlanoUseCase(
        ITenantContext tenantContext,
        IAssinaturaRepository assinaturaRepository,
        IUnitOfWork unitOfWork,
        ILogger<AtivarAssinaturaPlanoUseCase> logger)
    {
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _assinaturaRepository = assinaturaRepository ?? throw new ArgumentNullException(nameof(assinaturaRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<AssinaturaStatusOutputDto> ExecutarAsync(AtivarPlanoInputDto input, CancellationToken ct = default)
    {
        if (input == null)
            throw new ArgumentNullException(nameof(input));

        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var restauranteId = _tenantContext.RestauranteId;
        var plano = await _assinaturaRepository.ObterPlanoPorIdAsync(input.PlanoId, ct);
        if (plano == null || !plano.Ativo)
            throw new InvalidOperationException($"O plano informado '{input.PlanoId}' não existe ou não está ativo.");

        var assinatura = await _assinaturaRepository.ObterPorRestauranteIdAsync(restauranteId, ct);
        if (assinatura == null)
        {
            assinatura = new Assinatura(
                id: Guid.NewGuid(),
                restauranteId: restauranteId,
                dataInicio: DateTimeOffset.UtcNow,
                dataFimTrial: DateTimeOffset.UtcNow
            );
            await _assinaturaRepository.AdicionarAsync(assinatura, ct);
        }

        assinatura.AtivarPlano(plano.Id, input.MesesVigencia > 0 ? input.MesesVigencia : 1);
        await _assinaturaRepository.AtualizarAsync(assinatura, ct);
        await _unitOfWork.CommitAsync(ct);

        _logger.LogInformation("Assinatura do inquilino {TenantId} ativada com sucesso no plano '{NomePlano}'. Vigência até {DataExp}.",
            restauranteId, plano.Nome, assinatura.DataExpiracao);

        var planos = await _assinaturaRepository.ObterPlanosAtivosAsync(ct);
        var planosDto = planos.Select(p => new PlanoItemDto(
            p.Id,
            p.Nome,
            p.Descricao,
            p.PrecoMensal,
            p.PossuiModuloIa
        )).ToList();

        var planoAtualDto = new PlanoItemDto(
            plano.Id,
            plano.Nome,
            plano.Descricao,
            plano.PrecoMensal,
            plano.PossuiModuloIa
        );

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
