using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Produtos.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Produtos.UseCases;

/// <summary>
/// Caso de uso para obter os grupos e opções de modificadores ativos vinculados a um produto específico.
/// </summary>
public class ObterModificadoresProdutoUseCase
{
    private readonly IGrupoModificadorRepository _grupoModificadorRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ObterModificadoresProdutoUseCase> _logger;

    public ObterModificadoresProdutoUseCase(
        IGrupoModificadorRepository grupoModificadorRepository,
        ITenantContext tenantContext,
        ILogger<ObterModificadoresProdutoUseCase> logger)
    {
        _grupoModificadorRepository = grupoModificadorRepository ?? throw new ArgumentNullException(nameof(grupoModificadorRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public virtual async Task<IReadOnlyList<GrupoModificadorDto>> ExecutarAsync(Guid produtoId, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Contexto de restaurante (Tenant) não inicializado.");

        if (produtoId == Guid.Empty)
            throw new ArgumentException("O identificador do produto é obrigatório.", nameof(produtoId));

        var grupos = await _grupoModificadorRepository.ObterPorProdutoIdAsync(produtoId, ct);

        return grupos.Select(g => new GrupoModificadorDto(
            Id: g.Id,
            Nome: g.Nome,
            Descricao: g.Descricao,
            Obrigatorio: g.Obrigatorio,
            MinimoSelecoes: g.MinimoSelecoes,
            MaximoSelecoes: g.MaximoSelecoes,
            Opcoes: g.Opcoes.Where(o => o.Ativo).Select(o => new OpcaoModificadorDto(
                Id: o.Id,
                Nome: o.Nome,
                PrecoAdicional: o.PrecoAdicional,
                InsumoId: o.InsumoId,
                QuantidadeInsumo: o.QuantidadeInsumo,
                TipoAcao: o.TipoAcao.ToString()
            )).ToList()
        )).ToList();
    }
}
