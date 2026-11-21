using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Api.DTOs.Previsoes;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Application.Previsoes.UseCases;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/previsoes")]
public sealed class PrevisoesController : ControllerBase
{
    private readonly CalcularCapacidadeProducaoUseCase? _useCase;
    private readonly SolicitarPrevisaoDemandaUseCase? _solicitarPrevisaoDemandaUseCase;
    private readonly RegistrarOrdemCompraUseCase? _registrarOrdemCompraUseCase;

    public PrevisoesController(
        CalcularCapacidadeProducaoUseCase? useCase = null,
        SolicitarPrevisaoDemandaUseCase? solicitarPrevisaoDemandaUseCase = null,
        RegistrarOrdemCompraUseCase? registrarOrdemCompraUseCase = null)
    {
        _useCase = useCase;
        _solicitarPrevisaoDemandaUseCase = solicitarPrevisaoDemandaUseCase;
        _registrarOrdemCompraUseCase = registrarOrdemCompraUseCase;
    }

    /// <summary>
    /// Consulta o relatório de inteligência de capacidade produtiva e análise de rutura de estoque para uma data alvo informada (ou D+1).
    /// </summary>
    /// <param name="dataAlvo">Data de referência (formato YYYY-MM-DD). Se omitida, assume o dia seguinte (D+1).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Relatório consolidado de capacidade e sugestão de reposição de estoque.</returns>
    [HttpGet("capacidade")]
    [ProducesResponseType(typeof(RelatorioCapacidadeProducaoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ObterCapacidadeProducao([FromQuery] DateOnly? dataAlvo, CancellationToken ct)
    {
        if (_useCase == null)
            return StatusCode(501, new { error = "Caso de uso de capacidade não configurado." });

        try
        {
            var resultado = await _useCase.ExecutarAsync(dataAlvo, ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Dispara sob demanda a geração de previsão de IA para o restaurante via mensageria RabbitMQ.
    /// </summary>
    /// <param name="dataAlvo">Data de referência opcional (D+1 por padrão).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Confirmação da publicação dos eventos no RabbitMQ com CorrelationId.</returns>
    [HttpPost("disparar")]
    [ProducesResponseType(typeof(SolicitarPrevisaoDemandaOutputDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> DispararPrevisao([FromQuery] DateOnly? dataAlvo, CancellationToken ct)
    {
        if (_solicitarPrevisaoDemandaUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de disparo de previsão não configurado." });

        try
        {
            var resultado = await _solicitarPrevisaoDemandaUseCase.ExecutarAsync(dataAlvo, ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Registra uma nova ordem de compra de insumos gerada pelas projeções preditivas.
    /// </summary>
    [HttpPost("ordens-compra")]
    [ProducesResponseType(typeof(OrdemCompraOutputDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CriarOrdemCompra([FromBody] CriarOrdemCompraApiRequestDto request, CancellationToken ct)
    {
        if (_registrarOrdemCompraUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de ordem de compra não configurado." });

        var itensBrutos = request?.Itens ?? request?.Insumos;
        if (itensBrutos == null || itensBrutos.Count == 0)
            return BadRequest(new { error = "A ordem de compra deve conter ao menos um item de insumo." });

        try
        {
            var userIdStr = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? User?.FindFirst("sub")?.Value;
            var usuarioId = Guid.TryParse(userIdStr, out var id) ? id : Guid.Empty;

            var itensInput = itensBrutos
                .Where(i => i.InsumoId.HasValue && i.InsumoId.Value != Guid.Empty)
                .Select(i => new ItemOrdemCompraInputDto(i.InsumoId!.Value, i.Quantidade, i.PrecoUnitario))
                .ToList();

            if (itensInput.Count == 0)
                return BadRequest(new { error = "Nenhum insumo com identificador válido foi fornecido." });

            var inputDto = new CriarOrdemCompraInputDto(itensInput, request?.ValorTotal);
            var resultado = await _registrarOrdemCompraUseCase.ExecutarAsync(usuarioId, inputDto, ct);
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
