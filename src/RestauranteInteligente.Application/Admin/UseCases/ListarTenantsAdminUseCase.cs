using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Admin.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Admin.UseCases;

/// <summary>
/// Caso de uso de Backoffice para o SuperAdmin: lista todos os restaurantes da plataforma com seus gestores e status SaaS.
/// </summary>
public sealed class ListarTenantsAdminUseCase
{
    private readonly IRestauranteRepository _restauranteRepository;
    private readonly IAssinaturaRepository _assinaturaRepository;
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly ILogger<ListarTenantsAdminUseCase> _logger;

    public ListarTenantsAdminUseCase(
        IRestauranteRepository restauranteRepository,
        IAssinaturaRepository assinaturaRepository,
        IUsuarioRepository usuarioRepository,
        ILogger<ListarTenantsAdminUseCase> logger)
    {
        _restauranteRepository = restauranteRepository ?? throw new ArgumentNullException(nameof(restauranteRepository));
        _assinaturaRepository = assinaturaRepository ?? throw new ArgumentNullException(nameof(assinaturaRepository));
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<TenantAdminItemDto>> ExecutarAsync(CancellationToken ct = default)
    {
        var restaurantes = await _restauranteRepository.ObterTodosAsync(ct);
        var assinaturas = await _assinaturaRepository.ObterTodasAssinaturasAsync(ct);
        var usuarios = await _usuarioRepository.ObterTodosAsync(ct);
        var planos = await _assinaturaRepository.ObterPlanosAtivosAsync(ct);

        var assinaturasMap = assinaturas.ToDictionary(a => a.RestauranteId);
        var planosMap = planos.ToDictionary(p => p.Id);

        var resultado = new List<TenantAdminItemDto>();

        foreach (var rest in restaurantes)
        {
            var gestor = usuarios.FirstOrDefault(u => u.RestauranteId == rest.Id && u.Role.Contains("Manager", StringComparison.OrdinalIgnoreCase))
                      ?? usuarios.FirstOrDefault(u => u.RestauranteId == rest.Id);

            assinaturasMap.TryGetValue(rest.Id, out var assinatura);

            var planoNome = "Nenhum (Trial)";
            var precoMensal = 0m;

            if (assinatura?.PlanoId != null && planosMap.TryGetValue(assinatura.PlanoId.Value, out var plano))
            {
                planoNome = plano.Nome;
                precoMensal = plano.PrecoMensal;
            }

            var status = assinatura?.Status.ToString().ToUpperInvariant() ?? "SEM_ASSINATURA";
            var diasTrial = assinatura?.DiasRestantesTrial() ?? 0;
            var dataFimTrial = assinatura?.DataFimTrial ?? rest.CriadoEm.AddDays(14);
            var dataExpiracao = assinatura?.DataExpiracao;

            resultado.Add(new TenantAdminItemDto(
                RestauranteId: rest.Id,
                NomeRestaurante: rest.Nome,
                Cnpj: rest.Cnpj,
                Cidade: rest.Cidade,
                Estado: rest.Estado,
                DataCadastro: rest.CriadoEm,
                GestorNome: gestor?.Nome ?? "Não informado",
                GestorEmail: gestor?.Email ?? "Não informado",
                StatusAssinatura: status,
                DiasRestantesTrial: diasTrial,
                DataFimTrial: dataFimTrial,
                DataExpiracao: dataExpiracao,
                PlanoNome: planoNome,
                PrecoMensal: precoMensal
            ));
        }

        _logger.LogInformation("SuperAdmin listou {Qtd} inquilinos da plataforma.", resultado.Count);

        return resultado;
    }
}
