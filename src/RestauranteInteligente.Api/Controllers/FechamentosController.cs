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
    private readonly AbrirCaixaUseCase _abrirCaixaUseCase;
    private readonly FecharCaixaUseCase _fecharCaixaUseCase;

    public FechamentosController(
        AbrirCaixaUseCase abrirCaixaUseCase,
        FecharCaixaUseCase fecharCaixaUseCase)
    {
        _abrirCaixaUseCase = abrirCaixaUseCase;
        _fecharCaixaUseCase = fecharCaixaUseCase;
    }

    /// <summary>
    /// Inicia uma nova sessão de turno de caixa operacional para o restaurante.
    /// </summary>
    [HttpPost("abrir")]
    public async Task<IActionResult> AbrirCaixa([FromBody] AbrirCaixaRequestDto? request, CancellationToken ct)
    {
        try
        {
            Guid usuarioId;
            if (request?.UsuarioId.HasValue == true && request.UsuarioId.Value != Guid.Empty)
            {
                usuarioId = request.UsuarioId.Value;
            }
            else
            {
                var userIdStr = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                             ?? User?.FindFirst("sub")?.Value;

                if (!string.IsNullOrEmpty(userIdStr) && Guid.TryParse(userIdStr, out var parsedId))
                {
                    usuarioId = parsedId;
                }
                else
                {
                    return BadRequest(new { error = "Identificador do usuário operador é obrigatório." });
                }
            }

            var resultado = await _abrirCaixaUseCase.ExecutarAsync(usuarioId, ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
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
