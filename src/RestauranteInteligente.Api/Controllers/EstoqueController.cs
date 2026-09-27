using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Api.DTOs.Estoque;
using RestauranteInteligente.Application.Estoque.Services;
using RestauranteInteligente.Application.UseCases.Estoque.DTOs;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/estoque")]
public sealed class EstoqueController : ControllerBase
{
    private readonly BaixaEstoqueService _baixaEstoqueService;

    public EstoqueController(BaixaEstoqueService baixaEstoqueService)
    {
        _baixaEstoqueService = baixaEstoqueService;
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
            request.Motivo ?? "Baixa operacional de estoque via API",
            ct
        );

        if (!resultado.Sucesso)
        {
            return BadRequest(new { error = resultado.MensagemErro });
        }

        return Ok(new { status = "Baixa de estoque processada com sucesso sob transação segura e RLS." });
    }
}
