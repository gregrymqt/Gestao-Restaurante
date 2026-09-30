using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Application.Assinaturas.DTOs;
using RestauranteInteligente.Application.Assinaturas.UseCases;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/assinatura")]
public sealed class AssinaturaController : ControllerBase
{
    private readonly ObterStatusAssinaturaUseCase _obterStatusUseCase;
    private readonly AtivarAssinaturaPlanoUseCase _ativarPlanoUseCase;

    public AssinaturaController(
        ObterStatusAssinaturaUseCase obterStatusUseCase,
        AtivarAssinaturaPlanoUseCase ativarPlanoUseCase)
    {
        _obterStatusUseCase = obterStatusUseCase;
        _ativarPlanoUseCase = ativarPlanoUseCase;
    }

    /// <summary>
    /// Consulta a vigência da assinatura do inquilino atual, dias restantes de trial e catálogo de planos disponíveis.
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> ObterStatus(CancellationToken ct)
    {
        try
        {
            var resultado = await _obterStatusUseCase.ExecutarAsync(ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Contrata ou ativa um plano comercial após o período de teste de 14 dias (simulação de webhook / checkout SaaS).
    /// </summary>
    [HttpPost("assinar")]
    public async Task<IActionResult> AtivarPlano([FromBody] AtivarPlanoInputDto request, CancellationToken ct)
    {
        try
        {
            var resultado = await _ativarPlanoUseCase.ExecutarAsync(request, ct);
            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }
}
