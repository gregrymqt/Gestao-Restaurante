using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Api.DTOs.Estoque;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Estoque.Services;
using RestauranteInteligente.Application.UseCases.Estoque.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/estoque")]
public sealed class EstoqueController : ControllerBase
{
    private readonly BaixaEstoqueService _baixaEstoqueService;
    private readonly IInsumoRepository _insumoRepository;
    private readonly IProdutoRepository _produtoRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<EstoqueController> _logger;

    public EstoqueController(
        BaixaEstoqueService baixaEstoqueService,
        IInsumoRepository insumoRepository,
        IProdutoRepository produtoRepository,
        IUnitOfWork unitOfWork,
        ITenantContext tenantContext,
        ILogger<EstoqueController> logger)
    {
        _baixaEstoqueService = baixaEstoqueService;
        _insumoRepository = insumoRepository;
        _produtoRepository = produtoRepository;
        _unitOfWork = unitOfWork;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// Consulta todos os insumos e matérias-primas com cálculo de níveis de estoque e criticidade.
    /// </summary>
    [HttpGet("insumos")]
    public async Task<IActionResult> ObterInsumos(CancellationToken ct)
    {
        var insumos = await _insumoRepository.ObterTodosAtivosAsync(ct);

        var response = insumos.Select(i =>
        {
            var saldo = i.QuantidadeEstoque;
            var min = i.EstoqueMinimo;
            var ideal = min > 0 ? min * 2m : 10m;

            string statusNivel;
            if (saldo <= min)
                statusNivel = "critico";
            else if (saldo <= min * 1.5m)
                statusNivel = "atencao";
            else
                statusNivel = "normal";

            var percentual = ideal > 0 ? Math.Min(100m, Math.Round((saldo / ideal) * 100m, 1)) : 100m;
            var deficit = Math.Max(0m, min - saldo);

            var categoria = InferirCategoriaInsumo(i.Nome);

            return new InsumoResponse(
                Id: i.Id,
                Nome: i.Nome,
                Sku: $"#INS-{i.Id.ToString()[..4].ToUpperInvariant()}",
                Categoria: categoria,
                SaldoAtual: saldo,
                EstoqueMinimo: min,
                EstoqueIdeal: ideal,
                UnidadeMedida: i.UnidadeMedida.ToLowerInvariant(),
                StatusNivel: statusNivel,
                PercentualCapacidade: percentual,
                DeficitQuantidade: deficit,
                CustoUnitarioMedio: i.CustoUnitario
            );
        }).OrderBy(x => x.StatusNivel == "critico" ? 0 : x.StatusNivel == "atencao" ? 1 : 2)
          .ThenBy(x => x.Nome);

        return Ok(response);
    }

    /// <summary>
    /// Cadastra um novo insumo/ingrediente no restaurante com suporte a saldo inicial no livro-razão.
    /// </summary>
    [HttpPost("insumos")]
    public async Task<IActionResult> CadastrarInsumo([FromBody] CadastrarInsumoRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Nome) || string.IsNullOrWhiteSpace(request.UnidadeMedida))
        {
            return BadRequest(new { error = "Nome e Unidade de Medida são obrigatórios." });
        }

        if (request.EstoqueMinimo < 0m || request.CustoUnitario < 0m)
        {
            return BadRequest(new { error = "Estoque mínimo e custo unitário não podem ser negativos." });
        }

        if (!_tenantContext.HasTenant)
        {
            return Unauthorized(new { error = "Restaurante não autenticado." });
        }

        var tenantId = _tenantContext.RestauranteId;
        var insumo = new Insumo(
            id: Guid.NewGuid(),
            restauranteId: tenantId,
            nome: request.Nome.Trim(),
            unidadeMedida: request.UnidadeMedida.Trim().ToUpperInvariant(),
            estoqueMinimo: request.EstoqueMinimo,
            custoUnitario: request.CustoUnitario
        );

        if (request.SaldoInicial.HasValue && request.SaldoInicial.Value > 0m)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync(ct);
            insumo.CreditarEstoque(request.SaldoInicial.Value);
            await _insumoRepository.AdicionarAsync(insumo, ct);

            var mov = new MovimentacaoEstoque(
                id: Guid.NewGuid(),
                restauranteId: tenantId,
                insumoId: insumo.Id,
                tipo: TipoMovimentacao.Entrada,
                origem: OrigemMovimentacao.Compra,
                quantidade: request.SaldoInicial.Value,
                dataHora: DateTimeOffset.UtcNow,
                observacao: "Carga inicial no cadastro de insumo via App"
            );

            await _insumoRepository.AdicionarMovimentacaoAsync(mov, ct);
            await _unitOfWork.CommitAsync(ct);
            await tx.CommitAsync(ct);
        }
        else
        {
            await _insumoRepository.AdicionarAsync(insumo, ct);
            await _unitOfWork.CommitAsync(ct);
        }

        var ideal = insumo.EstoqueMinimo * 2m;
        var percentual = ideal > 0 ? Math.Min(100m, Math.Round((insumo.QuantidadeEstoque / ideal) * 100m, 1)) : 100m;

        var response = new InsumoResponse(
            Id: insumo.Id,
            Nome: insumo.Nome,
            Sku: $"#INS-{insumo.Id.ToString()[..4].ToUpperInvariant()}",
            Categoria: request.Categoria ?? InferirCategoriaInsumo(insumo.Nome),
            SaldoAtual: insumo.QuantidadeEstoque,
            EstoqueMinimo: insumo.EstoqueMinimo,
            EstoqueIdeal: ideal,
            UnidadeMedida: insumo.UnidadeMedida.ToLowerInvariant(),
            StatusNivel: insumo.QuantidadeEstoque < insumo.EstoqueMinimo ? "critico" : "normal",
            PercentualCapacidade: percentual,
            DeficitQuantidade: Math.Max(0m, insumo.EstoqueMinimo - insumo.QuantidadeEstoque),
            CustoUnitarioMedio: insumo.CustoUnitario
        );

        return CreatedAtAction(nameof(ObterInsumos), new { id = insumo.Id }, response);
    }

    /// <summary>
    /// Registra reabastecimento de estoque de mercadoria com inserção append-only no livro-razão.
    /// </summary>
    [HttpPost("entrada")]
    public async Task<IActionResult> RegistrarEntrada([FromBody] RegistrarEntradaEstoqueRequest request, CancellationToken ct)
    {
        if (request.InsumoId == Guid.Empty)
        {
            return BadRequest(new { error = "O identificador do insumo é obrigatório." });
        }

        if (request.Quantidade <= 0m)
        {
            return BadRequest(new { error = "A quantidade de entrada deve ser maior que zero." });
        }

        if (!_tenantContext.HasTenant)
        {
            return Unauthorized(new { error = "Restaurante não autenticado." });
        }

        await using var tx = await _unitOfWork.BeginTransactionAsync(ct);

        var insumos = await _insumoRepository.ObterPorIdsParaAtualizacaoAsync([request.InsumoId], ct);
        if (insumos.Count == 0)
        {
            await tx.RollbackAsync(ct);
            return NotFound(new { error = "Insumo não encontrado no estoque do restaurante." });
        }

        var insumo = insumos[0];
        insumo.CreditarEstoque(request.Quantidade);

        var mov = new MovimentacaoEstoque(
            id: Guid.NewGuid(),
            restauranteId: _tenantContext.RestauranteId,
            insumoId: insumo.Id,
            tipo: TipoMovimentacao.Entrada,
            origem: OrigemMovimentacao.Compra,
            quantidade: request.Quantidade,
            dataHora: DateTimeOffset.UtcNow,
            observacao: request.Observacao?.Trim() ?? "Entrada de mercadoria registrada via App"
        );

        await _insumoRepository.AdicionarMovimentacaoAsync(mov, ct);
        await _unitOfWork.CommitAsync(ct);
        await tx.CommitAsync(ct);

        _logger.LogInformation("Entrada de estoque: {Qtd} {Un} creditadas para insumo '{Nome}' (ID: {InsumoId}). Novo saldo: {NovoSaldo}.",
            request.Quantidade, insumo.UnidadeMedida, insumo.Nome, insumo.Id, insumo.QuantidadeEstoque);

        return Ok(new
        {
            id = mov.Id,
            insumoId = insumo.Id,
            quantidadeAdicionada = request.Quantidade,
            novoSaldo = insumo.QuantidadeEstoque,
            dataHora = mov.DataHora,
            protocoloLedger = $"LEDGER-IN-{mov.Id.ToString()[..8].ToUpperInvariant()}"
        });
    }

    /// <summary>
    /// Consulta todas as fichas técnicas cadastradas com composição de insumos e margem calculada.
    /// </summary>
    [HttpGet("fichas-tecnicas")]
    public async Task<IActionResult> ObterFichasTecnicas(CancellationToken ct)
    {
        var fichasCompletas = await _produtoRepository.ObterFichasTecnicasCompletasAsync(ct);

        var gruposPorProduto = fichasCompletas
            .GroupBy(f => f.ProdutoId)
            .ToList();

        var response = new List<FichaTecnicaResponse>();

        foreach (var grupo in gruposPorProduto)
        {
            var primeiro = grupo.First();
            var produto = primeiro.Produto;
            if (produto == null || !produto.Ativo) continue;

            var ingredientes = grupo.Select(f => new FichaTecnicaIngredienteResponse(
                InsumoId: f.InsumoId,
                Nome: f.Insumo?.Nome ?? "Insumo",
                Quantidade: $"{f.QuantidadeInsumo:0.##} {f.Insumo?.UnidadeMedida ?? ""}".Trim()
            )).ToList();

            var custoTotal = grupo.Sum(f => f.QuantidadeInsumo * (f.Insumo?.CustoUnitario ?? 0m));
            var margem = produto.Preco > 0m
                ? Math.Round(((produto.Preco - custoTotal) / produto.Preco) * 100m, 1)
                : 0m;

            var capacidade = grupo.Min(f =>
                f.Insumo != null && f.QuantidadeInsumo > 0m
                    ? (int)Math.Floor(f.Insumo.QuantidadeEstoque / f.QuantidadeInsumo)
                    : 0
            );

            response.Add(new FichaTecnicaResponse(
                Id: produto.Id,
                Nome: produto.Nome,
                Categoria: InferirCategoriaProduto(produto.Nome),
                ImagemUrl: null,
                Ingredientes: ingredientes,
                CustoInsumos: custoTotal,
                PrecoBalcao: produto.Preco,
                MargemBrutaPercentual: margem,
                CapacidadeTurnoPorcoes: Math.Max(0, capacidade)
            ));
        }

        return Ok(response);
    }

    /// <summary>
    /// Executa baixa transacional de estoque com ordenação anti-deadlock e ledger imutável.
    /// </summary>
    [HttpPost("baixa")]
    public async Task<IActionResult> BaixarEstoque([FromBody] BaixaEstoqueRequest request, CancellationToken ct)
    {
        if (request.Itens == null || request.Itens.Count == 0)
        {
            return BadRequest(new { error = "A lista de insumos para baixa é obrigatória." });
        }

        var itensDomain = request.Itens
            .Select(i => new ItemBaixaEstoqueDto(i.InsumoId, i.Quantidade))
            .ToList();

        var resultado = await _baixaEstoqueService.ExecutarBaixaAsync(
            itensDomain,
            request.Origem ?? OrigemMovimentacao.Venda,
            request.Observacao ?? "Baixa operacional de estoque via API",
            request.ReferenciaId,
            ct
        );

        if (!resultado.Sucesso)
        {
            return BadRequest(new { error = resultado.MensagemErro });
        }

        return Ok(new { status = "Baixa de estoque processada com sucesso sob transação segura e RLS." });
    }

    private static string InferirCategoriaInsumo(string nome)
    {
        var n = nome.ToLowerInvariant();
        if (n.Contains("carne") || n.Contains("angus") || n.Contains("bacon") || n.Contains("frango"))
            return "Proteínas / Carnes";
        if (n.Contains("queijo") || n.Contains("cheddar") || n.Contains("leite") || n.Contains("manteiga"))
            return "Laticínios";
        if (n.Contains("pão") || n.Contains("brioche") || n.Contains("farinha"))
            return "Panificação";
        if (n.Contains("batata") || n.Contains("cebola") || n.Contains("alface") || n.Contains("tomate"))
            return "Hortifrúti";
        if (n.Contains("refrigerante") || n.Contains("suco") || n.Contains("cerveja") || n.Contains("polpa"))
            return "Bebidas / Embalagens";
        return "Geral / Mercearia";
    }

    private static string InferirCategoriaProduto(string nome)
    {
        var n = nome.ToLowerInvariant();
        if (n.Contains("burger") || n.Contains("hambúrguer") || n.Contains("smash"))
            return "Hambúrgueres";
        if (n.Contains("batata") || n.Contains("onion") || n.Contains("porção"))
            return "Porções";
        if (n.Contains("refrigerante") || n.Contains("suco") || n.Contains("cerveja"))
            return "Bebidas";
        if (n.Contains("pudim") || n.Contains("brownie") || n.Contains("sorvete"))
            return "Sobremesas";
        return "Pratos";
    }
}
