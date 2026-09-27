using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Previsoes.UseCases;

/// <summary>
/// Caso de uso que analisa a capacidade produtiva e risco de rutura de estoque com base
/// na demanda projetada de Machine Learning e nas fichas técnicas (BOM) dos produtos.
/// Totalmente desacoplado de IAppDbContext utilizando IPrevisaoRepository e IProdutoRepository.
/// </summary>
public sealed class CalcularCapacidadeProducaoUseCase
{
    private readonly IPrevisaoRepository _previsaoRepository;
    private readonly IProdutoRepository _produtoRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<CalcularCapacidadeProducaoUseCase> _logger;

    public CalcularCapacidadeProducaoUseCase(
        IPrevisaoRepository previsaoRepository,
        IProdutoRepository produtoRepository,
        ITenantContext tenantContext,
        ILogger<CalcularCapacidadeProducaoUseCase> logger)
    {
        _previsaoRepository = previsaoRepository ?? throw new ArgumentNullException(nameof(previsaoRepository));
        _produtoRepository = produtoRepository ?? throw new ArgumentNullException(nameof(produtoRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RelatorioCapacidadeProducaoDto> ExecutarAsync(DateOnly? dataAlvo = null, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var tenantId = _tenantContext.RestauranteId;
        var dataReferencia = dataAlvo ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

        _logger.LogInformation("Iniciando análise de capacidade de estoque para restaurante {TenantId} e data {DataReferencia}.",
            tenantId, dataReferencia);

        // 1. Busca previsões da data de referência
        var previsoes = await _previsaoRepository.ObterPorDataAlvoAsync(dataReferencia, ct);

        // 2. Busca todas as fichas técnicas ativas com os respectivos insumos
        var fichasTecnicas = await _produtoRepository.ObterFichasTecnicasCompletasAsync(ct);

        var itensCapacidade = new List<ItemCapacidadeProducaoDto>();
        var demandaInsumosTotal = new Dictionary<Guid, (string Nome, string Unidade, decimal StockAtual, decimal ConsumoTotal)>();

        foreach (var previsao in previsoes)
        {
            var produtoId = previsao.ProdutoId;
            var nomeProduto = previsao.Produto?.Nome ?? "PRODUTO DESCONHECIDO";
            var demandaPrevista = previsao.QuantidadePrevista;

            var ingredientes = fichasTecnicas
                .Where(f => f.ProdutoId == produtoId && f.Insumo != null)
                .ToList();

            if (ingredientes.Count == 0)
            {
                // Sem ficha técnica: não é possível produzir
                itensCapacidade.Add(new ItemCapacidadeProducaoDto(
                    ProdutoId: produtoId,
                    NomeProduto: nomeProduto,
                    DemandaPrevista: demandaPrevista,
                    CapacidadeMaximaProducao: 0m,
                    DemandaAtendivel: 0m,
                    RiscoRutura: demandaPrevista > 0m,
                    InsumoGargaloNome: "NENHUM (SEM FICHA TÉCNICA)",
                    DeficitUnidades: demandaPrevista
                ));
                continue;
            }

            // Cálculo do gargalo limitante
            decimal menorCapacidade = decimal.MaxValue;
            string nomeInsumoGargalo = string.Empty;

            foreach (var ing in ingredientes)
            {
                var insumo = ing.Insumo!;
                var unidadesPossiveis = ing.QuantidadeInsumo > 0m
                    ? insumo.QuantidadeEstoque / ing.QuantidadeInsumo
                    : 0m;

                if (unidadesPossiveis < menorCapacidade)
                {
                    menorCapacidade = unidadesPossiveis;
                    nomeInsumoGargalo = insumo.Nome;
                }

                // Acumula consumo global para sugestão consolidada de compra
                var consumoParaEsteProduto = demandaPrevista * ing.QuantidadeInsumo;
                if (!demandaInsumosTotal.TryGetValue(insumo.Id, out var acumulado))
                {
                    demandaInsumosTotal[insumo.Id] = (insumo.Nome, insumo.UnidadeMedida, insumo.QuantidadeEstoque, consumoParaEsteProduto);
                }
                else
                {
                    demandaInsumosTotal[insumo.Id] = (acumulado.Nome, acumulado.Unidade, acumulado.StockAtual, acumulado.ConsumoTotal + consumoParaEsteProduto);
                }
            }

            var capacidadeMaxima = Math.Max(0m, Math.Floor(menorCapacidade));
            var demandaAtendivel = Math.Min(demandaPrevista, capacidadeMaxima);
            var riscoRutura = demandaPrevista > capacidadeMaxima;
            var deficitUnidades = Math.Max(0m, demandaPrevista - capacidadeMaxima);

            itensCapacidade.Add(new ItemCapacidadeProducaoDto(
                ProdutoId: produtoId,
                NomeProduto: nomeProduto,
                DemandaPrevista: demandaPrevista,
                CapacidadeMaximaProducao: capacidadeMaxima,
                DemandaAtendivel: demandaAtendivel,
                RiscoRutura: riscoRutura,
                InsumoGargaloNome: nomeInsumoGargalo,
                DeficitUnidades: deficitUnidades
            ));
        }

        // 3. Montagem da lista de sugestões de reposição de insumos com déficit
        var sugestoesReposicao = demandaInsumosTotal
            .Select(kvp =>
            {
                var insumoId = kvp.Key;
                var (Nome, Unidade, StockAtual, ConsumoTotal) = kvp.Value;
                var qtdComprar = Math.Max(0m, ConsumoTotal - StockAtual);

                return new SugestaoReposicaoInsumoDto(
                    InsumoId: insumoId,
                    NomeInsumo: Nome,
                    UnidadeMedida: Unidade,
                    StockAtual: StockAtual,
                    StockNecessario: ConsumoTotal,
                    QuantidadeComprar: qtdComprar
                );
            })
            .Where(s => s.QuantidadeComprar > 0m)
            .OrderByDescending(s => s.QuantidadeComprar)
            .ToList();

        _logger.LogInformation(
            "Análise concluída: {QtdProdutos} produtos analisados, {QtdRutura} com risco de rutura, {QtdInsumos} insumos necessitam reposição.",
            itensCapacidade.Count,
            itensCapacidade.Count(i => i.RiscoRutura),
            sugestoesReposicao.Count
        );

        return new RelatorioCapacidadeProducaoDto(
            DataReferencia: dataReferencia,
            ItensCapacidade: itensCapacidade,
            SugestoesReposicao: sugestoesReposicao
        );
    }
}
