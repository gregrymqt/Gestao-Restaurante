using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Api.DTOs.Caixa;
using RestauranteInteligente.Application.Caixa.DTOs;
using RestauranteInteligente.Application.Caixa.UseCases;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/caixa")]
public sealed class FechamentosController : ControllerBase
{
    private readonly AbrirCaixaUseCase _abrirCaixaUseCase;
    private readonly FecharCaixaUseCase _fecharCaixaUseCase;
    private readonly ObterStatusCaixaUseCase? _obterStatusCaixaUseCase;
    private readonly RegistrarMovimentacaoCaixaUseCase? _registrarMovimentacaoCaixaUseCase;
    private readonly ObterResumoTurnoUseCase? _obterResumoTurnoUseCase;

    public FechamentosController(
        AbrirCaixaUseCase abrirCaixaUseCase,
        FecharCaixaUseCase fecharCaixaUseCase,
        ObterStatusCaixaUseCase? obterStatusCaixaUseCase = null,
        RegistrarMovimentacaoCaixaUseCase? registrarMovimentacaoCaixaUseCase = null,
        ObterResumoTurnoUseCase? obterResumoTurnoUseCase = null)
    {
        _abrirCaixaUseCase = abrirCaixaUseCase;
        _fecharCaixaUseCase = fecharCaixaUseCase;
        _obterStatusCaixaUseCase = obterStatusCaixaUseCase;
        _registrarMovimentacaoCaixaUseCase = registrarMovimentacaoCaixaUseCase;
        _obterResumoTurnoUseCase = obterResumoTurnoUseCase;
    }

    /// <summary>
    /// Consulta o status e métricas da sessão de caixa operacional ativa no restaurante.
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> ObterStatus(CancellationToken ct)
    {
        if (_obterStatusCaixaUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de status não configurado." });

        var resultado = await _obterStatusCaixaUseCase.ExecutarAsync(ct);
        return Ok(resultado);
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

    /// <summary>
    /// Registra um suprimento (entrada) de dinheiro na gaveta do caixa ativo.
    /// </summary>
    [HttpPost("suprimento")]
    public async Task<IActionResult> Suprimento([FromBody] RegistrarMovimentacaoApiRequestDto request, CancellationToken ct)
    {
        if (_registrarMovimentacaoCaixaUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de movimentação de caixa não configurado." });

        if (request == null || request.Valor <= 0m)
            return BadRequest(new { error = "O valor do suprimento deve ser maior que zero." });

        try
        {
            var usuarioId = ObterUsuarioIdRequisicao();
            var motivo = string.IsNullOrWhiteSpace(request.Motivo) ? "Suprimento de troco" : request.Motivo;
            var input = new RegistrarMovimentacaoInputDto("SUPRIMENTO", request.Valor, motivo);

            var resultado = await _registrarMovimentacaoCaixaUseCase.ExecutarAsync(usuarioId, input, ct);
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
    /// Registra uma sangria (retirada) de dinheiro da gaveta do caixa ativo.
    /// </summary>
    [HttpPost("sangria")]
    public async Task<IActionResult> Sangria([FromBody] RegistrarMovimentacaoApiRequestDto request, CancellationToken ct)
    {
        if (_registrarMovimentacaoCaixaUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de movimentação de caixa não configurado." });

        if (request == null || request.Valor <= 0m)
            return BadRequest(new { error = "O valor da sangria deve ser maior que zero." });

        try
        {
            var usuarioId = ObterUsuarioIdRequisicao();
            var motivo = string.IsNullOrWhiteSpace(request.Motivo) ? "Sangria de caixa" : request.Motivo;
            var input = new RegistrarMovimentacaoInputDto("SANGRIA", request.Valor, motivo);

            var resultado = await _registrarMovimentacaoCaixaUseCase.ExecutarAsync(usuarioId, input, ct);
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
    /// Retorna o resumo consolidado do turno operacional atual para o gestor.
    /// </summary>
    [HttpGet("resumo-turno")]
    public async Task<IActionResult> ObterResumoTurno(CancellationToken ct)
    {
        if (_obterResumoTurnoUseCase == null)
            return StatusCode(501, new { error = "Caso de uso de resumo de turno não configurado." });

        try
        {
            var resultado = await _obterResumoTurnoUseCase.ExecutarAsync(ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }

    private Guid ObterUsuarioIdRequisicao()
    {
        var userIdStr = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User?.FindFirst("sub")?.Value;

        return Guid.TryParse(userIdStr, out var id) ? id : Guid.Empty;
    }
}
