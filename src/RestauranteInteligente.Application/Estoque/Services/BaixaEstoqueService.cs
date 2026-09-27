using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.UseCases.Estoque.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Application.Estoque.Services;

/// <summary>
/// Serviço de baixa de estoque com disciplina estrita anti-deadlock e transação explícita via Unit of Work.
/// Regras Mandatórias:
/// 1. Agrupar volumes por insumo.
/// 2. Ordenar determinísticamente por InsumoId ASC antes de qualquer bloqueio pessimista.
/// 3. Executar sob transação explícita (ITransactionScope) acionando o RLS Interceptor.
/// 4. Inserir lançamentos imutáveis no Livro-Razão (MovimentacoesEstoque).
/// </summary>
public sealed class BaixaEstoqueService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IInsumoRepository _insumoRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<BaixaEstoqueService> _logger;

    public BaixaEstoqueService(
        IUnitOfWork unitOfWork,
        IInsumoRepository insumoRepository,
        ITenantContext tenantContext,
        ILogger<BaixaEstoqueService> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _insumoRepository = insumoRepository ?? throw new ArgumentNullException(nameof(insumoRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<BaixaEstoqueResultDto> ExecutarBaixaAsync(
        IReadOnlyList<ItemBaixaEstoqueDto> itens,
        OrigemMovimentacao origem,
        string? observacao = null,
        Guid? referenciaId = null,
        CancellationToken ct = default)
    {
        if (itens == null || itens.Count == 0)
            return new BaixaEstoqueResultDto(false, "Nenhum insumo informado para baixa.");

        if (!_tenantContext.HasTenant)
            return new BaixaEstoqueResultDto(false, "Contexto de restaurante (Tenant) não inicializado.");

        var tenantId = _tenantContext.RestauranteId;

        // 1. Agrupamento de insumos e soma das quantidades demandadas
        var insumosDemandados = itens
            .GroupBy(i => i.InsumoId)
            .Select(g => new { InsumoId = g.Key, QuantidadeTotal = g.Sum(x => x.Quantidade) })
            // 2. REGRA CRÍTICA ANTI-DEADLOCK: Ordenação determinística ascendente obrigatória
            .OrderBy(x => x.InsumoId)
            .ToList();

        var idsOrdenados = insumosDemandados.Select(x => x.InsumoId).ToList();

        // 3. Abertura de Transação Explícita via IUnitOfWork (aciona o PostgresRlsTransactionInterceptor com SET LOCAL)
        await using var transaction = await _unitOfWork.BeginTransactionAsync(ct);

        try
        {
            // 4. Bloqueio pessimista no PostgreSQL (SELECT ... FOR UPDATE) na ordem ascendente
            var insumosBloqueados = await _insumoRepository.ObterPorIdsParaAtualizacaoAsync(idsOrdenados, ct);

            if (insumosBloqueados.Count != idsOrdenados.Count)
            {
                var faltantes = idsOrdenados.Except(insumosBloqueados.Select(i => i.Id)).ToList();
                _logger.LogWarning("Tentativa de baixa com insumos inexistentes ou pertencentes a outro restaurante: {Faltantes}", string.Join(", ", faltantes));
                return new BaixaEstoqueResultDto(false, "Um ou mais insumos solicitados não foram localizados no restaurante.");
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
                    return new BaixaEstoqueResultDto(false,
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
                    dataHora: DateTimeOffset.UtcNow,
                    referenciaId: referenciaId,
                    observacao: observacao
                );

                await _insumoRepository.AdicionarMovimentacaoAsync(movimentacao, ct);
            }

            // Persiste alterações atômicas no banco e comita a transação
            await _unitOfWork.CommitAsync(ct);
            await transaction.CommitAsync(ct);

            _logger.LogInformation("Baixa de estoque executada com sucesso para {Count} insumos no restaurante {TenantId}.",
                insumosDemandados.Count, tenantId);

            return new BaixaEstoqueResultDto(true);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            _logger.LogError(ex, "Erro transacional durante a baixa de estoque no restaurante {TenantId}.", tenantId);
            throw;
        }
    }
}
