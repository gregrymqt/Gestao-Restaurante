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
    private readonly ListarOrdensCompraUseCase? _listarOrdensCompraUseCase;
    private readonly AtualizarStatusOrdemCompraUseCase? _atualizarStatusOrdemCompraUseCase;
    private readonly ReceberOrdemCompraUseCase? _receberOrdemCompraUseCase;

    public PrevisoesController(
        CalcularCapacidadeProducaoUseCase? useCase = null,
        SolicitarPrevisaoDemandaUseCase? solicitarPrevisaoDemandaUseCase = null,
        RegistrarOrdemCompraUseCase? registrarOrdemCompraUseCase = null,
        ListarOrdensCompraUseCase? listarOrdensCompraUseCase = null,
        AtualizarStatusOrdemCompraUseCase? atualizarStatusOrdemCompraUseCase = null,
        ReceberOrdemCompraUseCase? receberOrdemCompraUseCase = null)
    {
        _useCase = useCase;
        _solicitarPrevisaoDemandaUseCase = solicitarPrevisaoDemandaUseCase;
        _registrarOrdemCompraUseCase = registrarOrdemCompraUseCase;
        _listarOrdensCompraUseCase = listarOrdensCompraUseCase;
        _atualizarStatusOrdemCompraUseCase = atualizarStatusOrdemCompraUseCase;
        _receberOrdemCompraUseCase = receberOrdemCompraUseCase;
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

    /// <summary>
    /// Lista as ordens de compra emitidas para o restaurante autenticado com suporte a filtro por status.
    /// </summary>
    [HttpGet("ordens-compra")]
    [ProducesResponseType(typeof(IReadOnlyList<OrdemCompraDetalheDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ListarOrdensCompra([FromQuery] string? status, CancellationToken ct)
    {
        if (_listarOrdensCompraUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de listagem de ordens de compra não configurado." });

        try
        {
            var resultado = await _listarOrdensCompraUseCase.ExecutarAsync(status, ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza o status de uma ordem de compra (Aprovação/Compra ou Cancelamento).
    /// </summary>
    [HttpPatch("ordens-compra/{id:guid}/status")]
    [ProducesResponseType(typeof(OrdemCompraDetalheDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AtualizarStatusOrdemCompra(
        [FromRoute] Guid id,
        [FromBody] AtualizarStatusOrdemCompraInputDto request,
        CancellationToken ct)
    {
        if (_atualizarStatusOrdemCompraUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de atualização de status não configurado." });

        if (request == null)
            return BadRequest(new { error = "Os dados da atualização de status são obrigatórios." });

        try
        {
            var resultado = await _atualizarStatusOrdemCompraUseCase.ExecutarAsync(id, request, ct);
            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Recebe a mercadoria de uma ordem de compra, creditando o estoque físico atomicamente no Ledger.
    /// </summary>
    [HttpPost("ordens-compra/{id:guid}/receber")]
    [ProducesResponseType(typeof(ReceberOrdemCompraOutputDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ReceberOrdemCompra([FromRoute] Guid id, CancellationToken ct)
    {
        if (_receberOrdemCompraUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de recebimento de ordem de compra não configurado." });

        try
        {
            var resultado = await _receberOrdemCompraUseCase.ExecutarAsync(id, ct);
            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }
}
