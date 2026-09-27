using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Application.Estoque.Services;

public sealed record ItemBaixaEstoque(Guid InsumoId, decimal Quantidade);

public sealed record BaixaEstoqueResult(bool Sucesso, string? MensagemErro = null);

/// <summary>
/// Serviço de baixa de estoque com disciplina estrita anti-deadlock e transação explícita.
/// Regras Mandatórias:
/// 1. Agrupar volumes por insumo.
/// 2. Ordenar determinísticamente por InsumoId ASC antes de qualquer bloqueio pessimista.
/// 3. Executar sob transação explícita (IDbContextTransaction) acionando o RLS Interceptor.
/// 4. Inserir lançamentos imutáveis no Livro-Razão (MovimentacoesEstoque).
/// </summary>
public sealed class BaixaEstoqueService
{
    private readonly IAppDbContext _dbContext;
    private readonly IInsumoRepository _insumoRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<BaixaEstoqueService> _logger;

    public BaixaEstoqueService(
        IAppDbContext dbContext,
        IInsumoRepository insumoRepository,
        ITenantContext tenantContext,
        ILogger<BaixaEstoqueService> logger)
    {
        _dbContext = dbContext;
        _insumoRepository = insumoRepository;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public async Task<BaixaEstoqueResult> ExecutarBaixaAsync(
        IReadOnlyList<ItemBaixaEstoque> itens,
        OrigemMovimentacao origem,
        string motivo,
        CancellationToken ct = default)
    {
        if (itens == null || itens.Count == 0)
            return new BaixaEstoqueResult(false, "Nenhum insumo informado para baixa.");

        if (!_tenantContext.HasTenant)
            return new BaixaEstoqueResult(false, "Contexto de restaurante (Tenant) não inicializado.");

        var tenantId = _tenantContext.RestauranteId;

        // 1. Agrupamento de insumos e soma das quantidades demandadas
        var insumosDemandados = itens
            .GroupBy(i => i.InsumoId)
            .Select(g => new { InsumoId = g.Key, QuantidadeTotal = g.Sum(x => x.Quantidade) })
            // 2. REGRA CRÍTICA ANTI-DEADLOCK: Ordenação determinística ascendente obrigatória
            .OrderBy(x => x.InsumoId)
            .ToList();

        var idsOrdenados = insumosDemandados.Select(x => x.InsumoId).ToList();

        // 3. Abertura de Transação Explícita (aciona o PostgresRlsTransactionInterceptor com SET LOCAL)
        await using var transaction = await _dbContext.BeginTransactionAsync(ct);

        try
        {
            // 4. Bloqueio pessimista no PostgreSQL (SELECT ... FOR UPDATE) na ordem ascendente
            var insumosBloqueados = await _insumoRepository.ObterPorIdsParaAtualizacaoAsync(idsOrdenados, ct);

            if (insumosBloqueados.Count != idsOrdenados.Count)
            {
                var faltantes = idsOrdenados.Except(insumosBloqueados.Select(i => i.Id)).ToList();
                _logger.LogWarning("Tentativa de baixa com insumos inexistentes ou pertencentes a outro restaurante: {Faltantes}", string.Join(", ", faltantes));
                return new BaixaEstoqueResult(false, "Um ou mais insumos solicitados não foram localizados no restaurante.");
            }

            // Dicionário para acesso rápido aos insumos bloqueados
            var insumoMap = insumosBloqueados.ToDictionary(i => i.Id);

            // 5. Verificação de saldo e aplicação atômica da baixa
            foreach (var item in insumosDemandados)
            {
                var insumo = insumoMap[item.InsumoId];

                // Valida se há saldo suficiente
                if (insumo.QuantidadeEstoque < item.QuantidadeTotal)
                {
                    await transaction.RollbackAsync(ct);
                    return new BaixaEstoqueResult(false,
                        $"Saldo insuficiente para o insumo '{insumo.Nome}'. Disponível: {insumo.QuantidadeEstoque}, Solicitado: {item.QuantidadeTotal}.");
                }

                // Debita da visão materializada
                insumo.DebitarEstoque(item.QuantidadeTotal);

                // Registra o lançamento imutável no ledger de estoque
                var movimentacao = new MovimentacaoEstoque(
                    id: Guid.NewGuid(),
                    restauranteId: tenantId,
                    insumoId: insumo.Id,
                    tipo: TipoMovimentacao.Saida,
                    origem: origem,
                    quantidade: item.QuantidadeTotal,
                    custoUnitarioMomento: insumo.CustoUnitario,
                    motivo: motivo
                );

                await _dbContext.MovimentacoesEstoque.AddAsync(movimentacao, ct);
            }

            // Persiste alterações atômicas no banco
            await _dbContext.SaveChangesAsync(ct);

            // Comita a transação
            await transaction.CommitAsync(ct);

            _logger.LogInformation("Baixa de estoque executada com sucesso para {Count} insumos no restaurante {TenantId}.",
                insumosDemandados.Count, tenantId);

            return new BaixaEstoqueResult(true);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            _logger.LogError(ex, "Erro transacional durante a baixa de estoque no restaurante {TenantId}.", tenantId);
            throw;
        }
    }
}
