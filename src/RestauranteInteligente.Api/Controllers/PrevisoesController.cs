using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    public PrevisoesController(
        CalcularCapacidadeProducaoUseCase? useCase = null,
        SolicitarPrevisaoDemandaUseCase? solicitarPrevisaoDemandaUseCase = null)
    {
        _useCase = useCase;
        _solicitarPrevisaoDemandaUseCase = solicitarPrevisaoDemandaUseCase;
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
}
