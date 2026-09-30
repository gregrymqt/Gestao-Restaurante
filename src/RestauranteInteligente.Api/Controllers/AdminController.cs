using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Application.Admin.DTOs;
using RestauranteInteligente.Application.Admin.UseCases;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/admin")]
public sealed class AdminController : ControllerBase
{
    private readonly ListarTenantsAdminUseCase _listarTenantsUseCase;
    private readonly EstenderTrialTenantUseCase _estenderTrialUseCase;
    private readonly AlterarStatusAssinaturaAdminUseCase _alterarStatusUseCase;

    public AdminController(
        ListarTenantsAdminUseCase listarTenantsUseCase,
        EstenderTrialTenantUseCase estenderTrialUseCase,
        AlterarStatusAssinaturaAdminUseCase alterarStatusUseCase)
    {
        _listarTenantsUseCase = listarTenantsUseCase;
        _estenderTrialUseCase = estenderTrialUseCase;
        _alterarStatusUseCase = alterarStatusUseCase;
    }

    /// <summary>
    /// Lista todos os inquilinos (Tenants) da plataforma, dados de contato e vigência de assinatura para o SuperAdmin.
    /// </summary>
    [HttpGet("tenants")]
    public async Task<IActionResult> ListarTenants(CancellationToken ct)
    {
        try
        {
            var resultado = await _listarTenantsUseCase.ExecutarAsync(ct);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Operação administrativa do SuperAdmin: estende os dias de degustação (Trial) para um inquilino específico.
    /// </summary>
    [HttpPost("tenants/{restauranteId:guid}/estender-trial")]
    public async Task<IActionResult> EstenderTrial(
        [FromRoute] Guid restauranteId,
        [FromBody] EstenderTrialInputDto request,
        CancellationToken ct)
    {
        try
        {
            var resultado = await _estenderTrialUseCase.ExecutarAsync(restauranteId, request, ct);
            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Operação administrativa do SuperAdmin: altera manualmente o status de assinatura de um inquilino (Ativa, Expirada, Cancelada).
    /// </summary>
    [HttpPost("tenants/{restauranteId:guid}/alterar-status")]
    public async Task<IActionResult> AlterarStatus(
        [FromRoute] Guid restauranteId,
        [FromBody] AlterarStatusAssinaturaInputDto request,
        CancellationToken ct)
    {
        try
        {
            var resultado = await _alterarStatusUseCase.ExecutarAsync(restauranteId, request, ct);
            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
