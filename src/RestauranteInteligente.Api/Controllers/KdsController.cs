using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Api.DTOs.Kds;
using RestauranteInteligente.Application.Kds.UseCases;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/kds")]
public sealed class KdsController : ControllerBase
{
    private readonly ListarPedidosKdsUseCase _listarPedidosKdsUseCase;
    private readonly AtualizarStatusPedidoKdsUseCase _atualizarStatusPedidoKdsUseCase;

    public KdsController(
        ListarPedidosKdsUseCase listarPedidosKdsUseCase,
        AtualizarStatusPedidoKdsUseCase atualizarStatusPedidoKdsUseCase)
    {
        _listarPedidosKdsUseCase = listarPedidosKdsUseCase ?? throw new ArgumentNullException(nameof(listarPedidosKdsUseCase));
        _atualizarStatusPedidoKdsUseCase = atualizarStatusPedidoKdsUseCase ?? throw new ArgumentNullException(nameof(atualizarStatusPedidoKdsUseCase));
    }

    /// <summary>
    /// Lista os pedidos ativos na fila operacional do KDS (RECEBIDO, EM_PREPARO, PRONTO) em ordem cronológica (FIFO).
    /// </summary>
    [HttpGet("pedidos")]
    public async Task<IActionResult> ListarPedidosAtivos(CancellationToken ct)
    {
        try
        {
            var resultado = await _listarPedidosKdsUseCase.ExecutarAsync(ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza o estágio operacional de preparo do pedido na cozinha e emite notificação em tempo real via SSE.
    /// </summary>
    [HttpPatch("pedidos/{id:guid}/status")]
    public async Task<IActionResult> AtualizarStatusPedido(
        Guid id,
        [FromBody] AtualizarStatusPedidoKdsRequestDto request,
        CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.StatusPreparo))
            return BadRequest(new { error = "O status de preparo é obrigatório." });

        try
        {
            var resultado = await _atualizarStatusPedidoKdsUseCase.ExecutarAsync(id, request.StatusPreparo, ct);
            return Ok(resultado);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
