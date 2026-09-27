using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Api.DTOs.Produtos;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/produtos")]
public sealed class ProdutosController : ControllerBase
{
    private readonly IProdutoRepository _produtoRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ProdutosController> _logger;

    public ProdutosController(
        IProdutoRepository produtoRepository,
        ITenantContext tenantContext,
        ILogger<ProdutosController> logger)
    {
        _produtoRepository = produtoRepository;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// Consulta catálogo de produtos restrito ao restaurante ativo no token JWT.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListarProdutos(CancellationToken ct)
    {
        var produtos = await _produtoRepository.ListarTodosAsync(ct);
        var response = produtos.Select(p => new ProdutoResponse(p.Id, p.Nome, p.Descricao, p.Preco, p.Ativo));
        return Ok(response);
    }

    /// <summary>
    /// Consulta produto específico por ID.
    /// Prevenção contra IDOR: se o registro pertencer a outro inquilino, o Global Query Filter
    /// e a validação de escopo impedem o vazamento retornando 404 Not Found.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId([FromRoute] Guid id, CancellationToken ct)
    {
        var produto = await _produtoRepository.ObterPorIdAsync(id, ct);
        if (produto == null)
        {
            _logger.LogWarning("Tentativa de acesso a produto inexistente ou pertencente a outro restaurante (ID: {ProdutoId}).", id);
            return NotFound(new { error = "Produto não encontrado." });
        }

        return Ok(new ProdutoResponse(produto.Id, produto.Nome, produto.Descricao, produto.Preco, produto.Ativo));
    }

    /// <summary>
    /// Cadastro de produto vinculado atomicamente ao restaurante do contexto.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CriarProduto([FromBody] CriarProdutoRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Nome) || request.Preco < 0m)
        {
            return BadRequest(new { error = "Nome e Preço válido (>= 0) são obrigatórios." });
        }

        var produto = new Produto(
            id: Guid.NewGuid(),
            restauranteId: _tenantContext.RestauranteId,
            nome: request.Nome,
            descricao: request.Descricao,
            preco: request.Preco
        );

        await _produtoRepository.AdicionarAsync(produto, ct);

        return CreatedAtAction(nameof(ObterPorId), new { id = produto.Id },
            new ProdutoResponse(produto.Id, produto.Nome, produto.Descricao, produto.Preco, produto.Ativo));
    }
}
