using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Admin.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Application.Admin.UseCases;

/// <summary>
/// Caso de uso de Backoffice para o SuperAdmin: altera manualmente o estado de vigência da assinatura de um restaurante.
/// </summary>
public sealed class AlterarStatusAssinaturaAdminUseCase
{
    private readonly IAssinaturaRepository _assinaturaRepository;
    private readonly IRestauranteRepository _restauranteRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AlterarStatusAssinaturaAdminUseCase> _logger;

    public AlterarStatusAssinaturaAdminUseCase(
        IAssinaturaRepository assinaturaRepository,
        IRestauranteRepository restauranteRepository,
        IUnitOfWork unitOfWork,
        ILogger<AlterarStatusAssinaturaAdminUseCase> logger)
    {
        _assinaturaRepository = assinaturaRepository ?? throw new ArgumentNullException(nameof(assinaturaRepository));
        _restauranteRepository = restauranteRepository ?? throw new ArgumentNullException(nameof(restauranteRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<TenantAdminItemDto> ExecutarAsync(Guid restauranteId, AlterarStatusAssinaturaInputDto input, CancellationToken ct = default)
    {
        if (restauranteId == Guid.Empty)
            throw new ArgumentException("Identificador de restaurante inválido.", nameof(restauranteId));

        if (input == null || string.IsNullOrWhiteSpace(input.NovoStatus))
            throw new ArgumentException("O novo status da assinatura é obrigatório.", nameof(input));

        if (!Enum.TryParse<StatusAssinatura>(input.NovoStatus, ignoreCase: true, out var statusEnum))
            throw new ArgumentException($"Status de assinatura inválido: '{input.NovoStatus}'. Valores permitidos: Trial, Ativa, Expirada, Cancelada.");

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
                dataFimTrial: DateTimeOffset.UtcNow.AddDays(14)
            );
            await _assinaturaRepository.AdicionarAsync(assinatura, ct);
        }

        if (input.PlanoId.HasValue && input.PlanoId.Value != Guid.Empty)
        {
            var plano = await _assinaturaRepository.ObterPlanoPorIdAsync(input.PlanoId.Value, ct);
            if (plano != null)
            {
                assinatura.AtivarPlano(plano.Id);
            }
        }
        else
        {
            assinatura.AlterarStatus(statusEnum);
        }

        await _assinaturaRepository.AtualizarAsync(assinatura, ct);
        await _unitOfWork.CommitAsync(ct);

        _logger.LogInformation("SuperAdmin alterou status da assinatura do restaurante {TenantId} para {NovoStatus}.",
            restauranteId, statusEnum);

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
            PlanoNome: "Atualizado",
            PrecoMensal: 0m
        );
    }
}
