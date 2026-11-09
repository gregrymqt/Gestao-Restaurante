using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Application.Dashboard.UseCases;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly ObterResumoDashboardUseCase _obterResumoDashboardUseCase;

    public DashboardController(ObterResumoDashboardUseCase obterResumoDashboardUseCase)
    {
        _obterResumoDashboardUseCase = obterResumoDashboardUseCase ?? throw new ArgumentNullException(nameof(obterResumoDashboardUseCase));
    }

    /// <summary>
    /// Consulta os KPIs executivos, status da operação, distribuição de meios de pagamento e alertas de estoque em tempo real.
    /// </summary>
    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumoDashboard(CancellationToken ct)
    {
        try
        {
            var resultado = await _obterResumoDashboardUseCase.ExecutarAsync(ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }
}
