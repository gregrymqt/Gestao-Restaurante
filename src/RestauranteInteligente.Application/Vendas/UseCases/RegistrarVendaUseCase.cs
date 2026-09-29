using System.Text.Json;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Vendas.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Application.Vendas.UseCases;

/// <summary>
/// Caso de uso atômico de registro de venda comercial com explosão de ficha técnica (BOM),
/// disciplina anti-deadlock (ordenação determinística por InsumoId ASC) e baixa transacional no estoque via Unit of Work.
/// </summary>
public sealed class RegistrarVendaUseCase
{
    private static readonly JsonSerializerOptions StreamJsonOptions = new()
    {
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private readonly IUnitOfWork _unitOfWork;
    private readonly IInsumoRepository _insumoRepository;
    private readonly IProdutoRepository _produtoRepository;
    private readonly IVendaRepository _vendaRepository;
    private readonly IFechamentoCaixaRepository _fechamentoCaixaRepository;
    private readonly ISseEventStreamService _streamService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<RegistrarVendaUseCase> _logger;

    public RegistrarVendaUseCase(
        IUnitOfWork unitOfWork,
        IInsumoRepository insumoRepository,
        IProdutoRepository produtoRepository,
        IVendaRepository vendaRepository,
        IFechamentoCaixaRepository fechamentoCaixaRepository,
        ISseEventStreamService streamService,
        ITenantContext tenantContext,
        ILogger<RegistrarVendaUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _insumoRepository = insumoRepository ?? throw new ArgumentNullException(nameof(insumoRepository));
        _produtoRepository = produtoRepository ?? throw new ArgumentNullException(nameof(produtoRepository));
        _vendaRepository = vendaRepository ?? throw new ArgumentNullException(nameof(vendaRepository));
        _fechamentoCaixaRepository = fechamentoCaixaRepository ?? throw new ArgumentNullException(nameof(fechamentoCaixaRepository));
        _streamService = streamService ?? throw new ArgumentNullException(nameof(streamService));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RegistrarVendaOutputDto> ExecutarAsync(RegistrarVendaInputDto input, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        if (input == null || input.Itens == null || input.Itens.Count == 0)
            throw new ArgumentException("A venda deve conter pelo menos um item.", nameof(input));

        if (string.IsNullOrWhiteSpace(input.FormaPagamento))
            throw new ArgumentException("A forma de pagamento é obrigatória.", nameof(input));

        var tenantId = _tenantContext.RestauranteId;

        // 1. Validação de Caixa Aberto
        var caixaAberto = await _fechamentoCaixaRepository.ObterCaixaAbertoAsync(ct);

        if (caixaAberto == null)
            throw new InvalidOperationException("Operação cancelada: Não há sessão de caixa aberta para registrar vendas no restaurante.");

        // 2. Consulta dos Produtos com sua Ficha Técnica (BOM)
        var produtoIds = input.Itens.Select(i => i.ProdutoId).Distinct().ToList();
        var produtos = await _produtoRepository.ObterPorIdsComFichaTecnicaAsync(produtoIds, ct);

        if (produtos.Count != produtoIds.Count)
        {
            var faltantes = produtoIds.Except(produtos.Select(p => p.Id)).ToList();
            _logger.LogWarning("Tentativa de venda com produtos inexistentes no restaurante {TenantId}: {Faltantes}",
                tenantId, string.Join(", ", faltantes));
            throw new InvalidOperationException("Um ou mais produtos informados não foram localizados no catálogo do restaurante.");
        }

        var inativos = produtos.Where(p => !p.Ativo).ToList();
        if (inativos.Count != 0)
        {
            throw new InvalidOperationException($"O produto '{inativos[0].Nome}' está inativo e não pode ser comercializado.");
        }

        var produtoMap = produtos.ToDictionary(p => p.Id);

        // 3. Explosão de Ficha Técnica (BOM): cálculo da necessidade agregada por Insumo
        var consumoPorInsumo = new Dictionary<Guid, decimal>();

        foreach (var itemInput in input.Itens)
        {
            if (itemInput.Quantidade <= 0m)
                throw new ArgumentException($"A quantidade vendida para o produto '{itemInput.ProdutoId}' deve ser maior que zero.", nameof(input));

            var produto = produtoMap[itemInput.ProdutoId];
            foreach (var ficha in produto.FichaTecnica)
            {
                var consumoTotalItem = itemInput.Quantidade * ficha.QuantidadeInsumo;
                if (consumoPorInsumo.TryGetValue(ficha.InsumoId, out var acumulado))
                {
                    consumoPorInsumo[ficha.InsumoId] = acumulado + consumoTotalItem;
                }
                else
                {
                    consumoPorInsumo[ficha.InsumoId] = consumoTotalItem;
                }
            }
        }

        // 4. REGRA CRÍTICA ANTI-DEADLOCK: Ordenação determinística ascendente obrigatória por InsumoId
        var insumosOrdenados = consumoPorInsumo
            .OrderBy(x => x.Key)
            .ToList();

        var idsInsumosOrdenados = insumosOrdenados.Select(x => x.Key).ToList();

        // 5. Transação Atômica ACID via IUnitOfWork (BeginTransactionAsync)
        await using var transaction = await _unitOfWork.BeginTransactionAsync(ct);

        try
        {
            Dictionary<Guid, Insumo> insumoMap;

            if (idsInsumosOrdenados.Count > 0)
            {
                // Bloqueio pessimista no PostgreSQL (SELECT ... FOR UPDATE) na ordem ascendente
                var insumosBloqueados = await _insumoRepository.ObterPorIdsParaAtualizacaoAsync(idsInsumosOrdenados, ct);

                if (insumosBloqueados.Count != idsInsumosOrdenados.Count)
                {
                    var faltantes = idsInsumosOrdenados.Except(insumosBloqueados.Select(i => i.Id)).ToList();
                    _logger.LogWarning("Insumos de ficha técnica não encontrados no restaurante {TenantId}: {Faltantes}",
                        tenantId, string.Join(", ", faltantes));
                    await transaction.RollbackAsync(ct);
                    throw new InvalidOperationException("Um ou mais insumos da ficha técnica não foram localizados no estoque.");
                }

                insumoMap = insumosBloqueados.ToDictionary(i => i.Id);

                // Validação de saldo prévia antes de qualquer débito
                foreach (var demanda in insumosOrdenados)
                {
                    var insumo = insumoMap[demanda.Key];
                    if (insumo.QuantidadeEstoque < demanda.Value)
                    {
                        await transaction.RollbackAsync(ct);
                        throw new InvalidOperationException(
                            $"Saldo insuficiente para o insumo '{insumo.Nome}'. " +
                            $"Disponível: {insumo.QuantidadeEstoque:F4} {insumo.UnidadeMedida}, Solicitado: {demanda.Value:F4} {insumo.UnidadeMedida}.");
                    }
                }
            }
            else
            {
                insumoMap = new Dictionary<Guid, Insumo>();
            }

            // 6. Instanciação da Venda e Congelamento de Preço dos Itens
            var vendaId = Guid.NewGuid();
            var venda = new Venda(
                id: vendaId,
                restauranteId: tenantId,
                formaPagamento: input.FormaPagamento,
                fechamentoCaixaId: caixaAberto.Id,
                dataHora: DateTimeOffset.UtcNow,
                status: "CONCLUIDA"
            );

            foreach (var itemInput in input.Itens)
            {
                var produto = produtoMap[itemInput.ProdutoId];
                venda.AdicionarItem(produto.Id, itemInput.Quantidade, produto.Preco);
            }

            // 7. Débito no estoque e inclusão de lançamentos append-only no Livro-Razão
            var insumosCriticos = new List<Insumo>();
            foreach (var demanda in insumosOrdenados)
            {
                var insumo = insumoMap[demanda.Key];
                insumo.DebitarEstoque(demanda.Value);

                if (insumo.QuantidadeEstoque <= insumo.EstoqueMinimo)
                {
                    insumosCriticos.Add(insumo);
                }

                var movimentacao = new MovimentacaoEstoque(
                    id: Guid.NewGuid(),
                    restauranteId: tenantId,
                    insumoId: insumo.Id,
                    tipo: TipoMovimentacao.Saida,
                    origem: OrigemMovimentacao.Venda,
                    quantidade: demanda.Value,
                    dataHora: DateTimeOffset.UtcNow,
                    referenciaId: venda.Id,
                    observacao: $"Baixa por venda {venda.Id} (BOM)"
                );

                await _insumoRepository.AdicionarMovimentacaoAsync(movimentacao, ct);
            }

            // 8. Persistência da Venda com ItensVenda vinculados
            await _vendaRepository.AdicionarAsync(venda, ct);

            // 9. Atualização atômica dos acumuladores da sessão de caixa
            caixaAberto.RegistrarVenda(venda.ValorTotal);

            // 10. Persistência final e Commit via IUnitOfWork
            await _unitOfWork.CommitAsync(ct);
            await transaction.CommitAsync(ct);

            _logger.LogInformation("Venda {VendaId} registrada com sucesso no restaurante {TenantId}. Valor: {ValorTotal:C}",
                venda.Id, tenantId, venda.ValorTotal);

            // 11. Disparo de alertas reativos de estoque crítico no barramento SSE do tenant
            foreach (var critico in insumosCriticos)
            {
                var payload = JsonSerializer.Serialize(new
                {
                    insumoId = critico.Id,
                    nomeInsumo = critico.Nome,
                    saldoAtual = critico.QuantidadeEstoque,
                    saldoMinimo = critico.EstoqueMinimo,
                    unidadeMedida = critico.UnidadeMedida
                }, StreamJsonOptions);

                try
                {
                    await _streamService.PublishAsync(
                        tenantId,
                        "EstoqueCritico",
                        payload,
                        Guid.NewGuid(),
                        ct);
                    _logger.LogWarning("Alerta de estoque crítico disparado para o insumo '{NomeInsumo}' ({SaldoAtual} {Unidade}) no restaurante {TenantId}.",
                        critico.Nome, critico.QuantidadeEstoque, critico.UnidadeMedida, tenantId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao publicar evento de estoque crítico para o insumo {InsumoId} no restaurante {TenantId}.",
                        critico.Id, tenantId);
                }
            }

            return new RegistrarVendaOutputDto(
                venda.Id,
                venda.RestauranteId,
                venda.FechamentoCaixaId!.Value,
                venda.DataHora,
                venda.Status,
                venda.FormaPagamento,
                venda.ValorTotal,
                venda.Itens.Select(i => new ItemVendaOutputDto(
                    i.Id,
                    i.ProdutoId,
                    i.Quantidade,
                    i.PrecoUnitario,
                    i.Subtotal
                )).ToList()
            );
        }
        catch (Exception ex)
        {
            try
            {
                await transaction.RollbackAsync(ct);
            }
            catch (Exception rollbackEx)
            {
                _logger.LogWarning(rollbackEx, "Exceção secundária durante o Rollback da transação de venda.");
            }

            _logger.LogError(ex, "Falha na transação de registro de venda no restaurante {TenantId}.", tenantId);
            throw;
        }
    }
}
