using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Admin.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Admin.UseCases;

/// <summary>
/// Caso de uso de Backoffice para o SuperAdmin: estende o período de degustação de um restaurante.
/// </summary>
public sealed class EstenderTrialTenantUseCase
{
    private readonly IAssinaturaRepository _assinaturaRepository;
    private readonly IRestauranteRepository _restauranteRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<EstenderTrialTenantUseCase> _logger;

    public EstenderTrialTenantUseCase(
        IAssinaturaRepository assinaturaRepository,
        IRestauranteRepository restauranteRepository,
        IUnitOfWork unitOfWork,
        ILogger<EstenderTrialTenantUseCase> logger)
    {
        _assinaturaRepository = assinaturaRepository ?? throw new ArgumentNullException(nameof(assinaturaRepository));
        _restauranteRepository = restauranteRepository ?? throw new ArgumentNullException(nameof(restauranteRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<TenantAdminItemDto> ExecutarAsync(Guid restauranteId, EstenderTrialInputDto input, CancellationToken ct = default)
    {
        if (restauranteId == Guid.Empty)
            throw new ArgumentException("Identificador de restaurante inválido.", nameof(restauranteId));

        if (input == null || input.DiasAdicionais <= 0)
            throw new ArgumentException("A quantidade de dias adicionais deve ser maior que zero.", nameof(input));

        var restaurante = await _restauranteRepository.ObterPorIdAsync(restauranteId, ct);
        if (restaurante == null)
            throw new InvalidOperationException($"Restaurante '{restauranteId}' não localizado na base de dados.");

        var assinatura = await _assinaturaRepository.ObterPorRestauranteIdAsync(restauranteId, ct);
        if (assinatura == null)
        {
            assinatura = new Assinatura(
                id: Guid.NewGuid(),
                restauranteId: restauranteId,
                dataInicio: DateTimeOffset.UtcNow,
                dataFimTrial: DateTimeOffset.UtcNow.AddDays(input.DiasAdicionais)
            );
            await _assinaturaRepository.AdicionarAsync(assinatura, ct);
        }
        else
        {
            assinatura.EstenderTrial(input.DiasAdicionais);
            await _assinaturaRepository.AtualizarAsync(assinatura, ct);
        }

        await _unitOfWork.CommitAsync(ct);

        _logger.LogInformation("SuperAdmin estendeu trial do restaurante {TenantId} (+{Dias} dias). Nova data final: {FimTrial}.",
            restauranteId, input.DiasAdicionais, assinatura.DataFimTrial);

        return new TenantAdminItemDto(
            RestauranteId: restaurante.Id,
            NomeRestaurante: restaurante.Nome,
            Cnpj: restaurante.Cnpj,
            Cidade: restaurante.Cidade,
            Estado: restaurante.Estado,
            DataCadastro: restaurante.CriadoEm,
            GestorNome: "Gestor",
            GestorEmail: "gestor@restaurante.com",
            StatusAssinatura: assinatura.Status.ToString().ToUpperInvariant(),
            DiasRestantesTrial: assinatura.DiasRestantesTrial(),
            DataFimTrial: assinatura.DataFimTrial,
            DataExpiracao: assinatura.DataExpiracao,
            PlanoNome: "Nenhum (Trial)",
            PrecoMensal: 0m
        );
    }
}
