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

    public async Task<TenantsAdminPaginadoDto> ExecutarAsync(
        ConsultaTenantsAdminFiltro? filtro = null,
        CancellationToken ct = default)
    {
        filtro ??= new ConsultaTenantsAdminFiltro();
        var pagina = Math.Max(1, filtro.Pagina);
        var itensPorPagina = filtro.ItensPorPagina > 0 ? filtro.ItensPorPagina : 20;

        var restaurantes = await _restauranteRepository.ObterTodosAsync(ct);
        var assinaturas = await _assinaturaRepository.ObterTodasAssinaturasAsync(ct);
        var usuarios = await _usuarioRepository.ObterTodosAsync(ct);
        var planos = await _assinaturaRepository.ObterPlanosAtivosAsync(ct);

        var assinaturasMap = assinaturas.ToDictionary(a => a.RestauranteId);
        var planosMap = planos.ToDictionary(p => p.Id);

        var todosItens = new List<TenantAdminItemDto>();

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

            todosItens.Add(new TenantAdminItemDto(
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

        var query = todosItens.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(filtro.Busca))
        {
            var termo = filtro.Busca.Trim();
            query = query.Where(t =>
                t.NomeRestaurante.Contains(termo, StringComparison.OrdinalIgnoreCase) ||
                t.Cnpj.Contains(termo, StringComparison.OrdinalIgnoreCase) ||
                t.GestorNome.Contains(termo, StringComparison.OrdinalIgnoreCase) ||
                t.GestorEmail.Contains(termo, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Status) && !filtro.Status.Equals("TODOS", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.StatusAssinatura.Equals(filtro.Status.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        var listaFiltrada = query.ToList();
        var totalItens = listaFiltrada.Count;
        var totalPaginas = (int)Math.Ceiling((double)totalItens / itensPorPagina);
        if (totalPaginas == 0) totalPaginas = 1;

        var itensPaginados = listaFiltrada
            .Skip((pagina - 1) * itensPorPagina)
            .Take(itensPorPagina)
            .ToList();

        _logger.LogInformation("SuperAdmin listou {Qtd} inquilinos (Total: {Total}, Página: {Pagina}/{TotalPaginas}).",
            itensPaginados.Count, totalItens, pagina, totalPaginas);

        return new TenantsAdminPaginadoDto(
            Itens: itensPaginados,
            TotalItens: totalItens,
            PaginaAtual: pagina,
            TotalPaginas: totalPaginas
        );
    }
}
