using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Application.Auth.DTOs;
using RestauranteInteligente.Application.Auth.UseCases;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Api.Controllers;

/// <summary>
/// Controlador para gestão de equipe, operadores de PDV e colaboradores do restaurante.
/// </summary>
[ApiController]
[Authorize(Roles = "Manager,Owner,SuperAdmin")]
[Route("api/v1/equipe")]
public sealed class EquipeController : ControllerBase
{
    private readonly ITenantContext _tenantContext;
    private readonly CriarOperadorUseCase _criarOperadorUseCase;
    private readonly ListarOperadoresRestauranteUseCase _listarOperadoresUseCase;
    private readonly IUsuarioRepository _usuarioRepository;

    public EquipeController(
        ITenantContext tenantContext,
        CriarOperadorUseCase criarOperadorUseCase,
        ListarOperadoresRestauranteUseCase listarOperadoresUseCase,
        IUsuarioRepository usuarioRepository)
    {
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _criarOperadorUseCase = criarOperadorUseCase ?? throw new ArgumentNullException(nameof(criarOperadorUseCase));
        _listarOperadoresUseCase = listarOperadoresUseCase ?? throw new ArgumentNullException(nameof(listarOperadoresUseCase));
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
    }

    /// <summary>
    /// Lista todos os colaboradores cadastrados para o restaurante autenticado.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListarEquipe(CancellationToken ct)
    {
        if (!_tenantContext.HasTenant)
            return Unauthorized(new { error = "Contexto de restaurante (Tenant) não identificado." });

        var resultado = await _listarOperadoresUseCase.ExecutarAsync(_tenantContext.RestauranteId, ct);
        return Ok(resultado);
    }

    /// <summary>
    /// Cadastra um novo operador ou gestor na equipe do restaurante.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CadastrarOperador([FromBody] CriarOperadorInputDto input, CancellationToken ct)
    {
        if (!_tenantContext.HasTenant)
            return Unauthorized(new { error = "Contexto de restaurante (Tenant) não identificado." });

        try
        {
            var resultado = await _criarOperadorUseCase.ExecutarAsync(_tenantContext.RestauranteId, input, ct);
            return StatusCode(StatusCodes.Status201Created, resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Desativa o acesso de um colaborador da equipe.
    /// </summary>
    [HttpPatch("{id:guid}/desativar")]
    public async Task<IActionResult> DesativarOperador([FromRoute] Guid id, CancellationToken ct)
    {
        if (!_tenantContext.HasTenant)
            return Unauthorized(new { error = "Contexto de restaurante (Tenant) não identificado." });

        var usuario = await _usuarioRepository.ObterPorIdAsync(id, ct);
        if (usuario == null || usuario.RestauranteId != _tenantContext.RestauranteId)
        {
            return NotFound(new { error = "Colaborador não encontrado nesta unidade." });
        }

        usuario.Desativar();
        await _usuarioRepository.AtualizarAsync(usuario, ct);

        return Ok(new { message = "Colaborador desativado com sucesso." });
    }

    /// <summary>
    /// Reativa o acesso de um colaborador da equipe.
    /// </summary>
    [HttpPatch("{id:guid}/ativar")]
    public async Task<IActionResult> AtivarOperador([FromRoute] Guid id, CancellationToken ct)
    {
        if (!_tenantContext.HasTenant)
            return Unauthorized(new { error = "Contexto de restaurante (Tenant) não identificado." });

        var usuario = await _usuarioRepository.ObterPorIdAsync(id, ct);
        if (usuario == null || usuario.RestauranteId != _tenantContext.RestauranteId)
        {
            return NotFound(new { error = "Colaborador não encontrado nesta unidade." });
        }

        usuario.Ativar();
        await _usuarioRepository.AtualizarAsync(usuario, ct);

        return Ok(new { message = "Colaborador reativado com sucesso." });
    }
}
