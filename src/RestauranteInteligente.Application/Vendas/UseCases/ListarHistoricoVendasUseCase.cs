using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Vendas.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Vendas.UseCases;

/// <summary>
/// Caso de uso para consulta do histórico de vendas do restaurante com isolamento multi-tenant.
/// </summary>
public sealed class ListarHistoricoVendasUseCase
{
    private readonly IVendaRepository _vendaRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ListarHistoricoVendasUseCase> _logger;

    public ListarHistoricoVendasUseCase(
        IVendaRepository vendaRepository,
        ITenantContext tenantContext,
        ILogger<ListarHistoricoVendasUseCase> logger)
    {
        _vendaRepository = vendaRepository ?? throw new ArgumentNullException(nameof(vendaRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<VendaHistoricoDto>> ExecutarAsync(DateTimeOffset? dataInicio = null, int limite = 50, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
        {
            throw new InvalidOperationException("Contexto de restaurante (Tenant) não inicializado.");
        }

        var vendas = dataInicio.HasValue
            ? await _vendaRepository.ObterVendasConcluidasPorPeriodoAsync(dataInicio.Value, ct)
            : await _vendaRepository.ObterUltimasVendasAsync(limite, ct);

        return vendas.Select(v => new VendaHistoricoDto(
            VendaId: v.Id,
            RestauranteId: v.RestauranteId,
            FechamentoCaixaId: v.FechamentoCaixaId,
            DataHora: v.DataHora,
            Status: v.Status,
            StatusPreparo: v.StatusPreparo,
            FormaPagamento: v.FormaPagamento,
            ValorTotal: v.ValorTotal,
            QuantidadeItens: v.Itens.Count,
            Itens: v.Itens.Select(i => new VendaHistoricoItemDto(
                Id: i.Id,
                ProdutoId: i.ProdutoId,
                NomeProduto: i.Produto?.Nome ?? "Produto sem identificação",
                Quantidade: i.Quantidade,
                PrecoUnitario: i.PrecoUnitario,
                Subtotal: i.Subtotal,
                ModificadoresJson: i.ModificadoresJson
            )).ToList()
        )).ToList();
    }
}
