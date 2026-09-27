using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Api.DTOs.Caixa;
using RestauranteInteligente.Application.Caixa.UseCases;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/caixa")]
public sealed class FechamentosController : ControllerBase
{
    private readonly FecharCaixaUseCase _fecharCaixaUseCase;

    public FechamentosController(FecharCaixaUseCase fecharCaixaUseCase)
    {
        _fecharCaixaUseCase = fecharCaixaUseCase;
    }

    /// <summary>
    /// Encerra a sessão de caixa ativa do restaurante e dispara a solicitação de previsão de demanda via RabbitMQ.
    /// </summary>
    [HttpPost("fechar")]
    public async Task<IActionResult> FecharCaixa(CancellationToken ct)
    {
        try
        {
            var resultado = await _fecharCaixaUseCase.ExecutarAsync(ct);

            var response = new FecharCaixaResponseDto(
                resultado.FechamentoCaixaId,
                resultado.RestauranteId,
                resultado.DataAbertura,
                resultado.DataFechamento,
                resultado.ValorTotalVendas,
                resultado.QuantidadeVendas,
                resultado.Status,
                resultado.CorrelationId
            );

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }
}
