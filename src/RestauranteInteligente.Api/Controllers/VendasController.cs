using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Api.DTOs.Vendas;
using RestauranteInteligente.Application.Vendas.DTOs;
using RestauranteInteligente.Application.Vendas.UseCases;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/vendas")]
public sealed class VendasController : ControllerBase
{
    private readonly RegistrarVendaUseCase _registrarVendaUseCase;

    public VendasController(RegistrarVendaUseCase registrarVendaUseCase)
    {
        _registrarVendaUseCase = registrarVendaUseCase;
    }

    /// <summary>
    /// Registra uma venda comercial com explosão de BOM, trava pessimista anti-deadlock e baixa de estoque atômica.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> RegistrarVenda([FromBody] RegistrarVendaRequestDto request, CancellationToken ct)
    {
        if (request == null || request.Itens == null || request.Itens.Count == 0)
        {
            return BadRequest(new { error = "A venda deve conter ao menos um item válido." });
        }

        if (string.IsNullOrWhiteSpace(request.FormaPagamento))
        {
            return BadRequest(new { error = "A forma de pagamento é obrigatória." });
        }

        try
        {
            var input = new RegistrarVendaInputDto(
                request.FormaPagamento,
                request.Itens.Select(i => new ItemVendaInputDto(i.ProdutoId, i.Quantidade)).ToList()
            );

            var resultado = await _registrarVendaUseCase.ExecutarAsync(input, ct);

            var response = new VendaResponseDto(
                resultado.VendaId,
                resultado.RestauranteId,
                resultado.FechamentoCaixaId,
                resultado.DataHora,
                resultado.Status,
                resultado.FormaPagamento,
                resultado.ValorTotal,
                resultado.Itens.Select(i => new ItemVendaResponseDto(
                    i.Id,
                    i.ProdutoId,
                    i.Quantidade,
                    i.PrecoUnitario,
                    i.Subtotal
                )).ToList()
            );

            return StatusCode(201, response);
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
