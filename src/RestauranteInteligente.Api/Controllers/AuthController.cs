using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IJwtTokenGenerator _tokenGenerator;
    private readonly ITokenBlacklistService _blacklistService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuthUserService _authUserService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IJwtTokenGenerator tokenGenerator,
        ITokenBlacklistService blacklistService,
        IRefreshTokenService refreshTokenService,
        IPasswordHasher passwordHasher,
        IAuthUserService authUserService,
        ILogger<AuthController> logger)
    {
        _tokenGenerator = tokenGenerator;
        _blacklistService = blacklistService;
        _refreshTokenService = refreshTokenService;
        _passwordHasher = passwordHasher;
        _authUserService = authUserService;
        _logger = logger;
    }

    /// <summary>
    /// Endpoint de autenticação: valida credenciais com hash criptográfico, vincula o inquilino legítimo
    /// e emite Access Token curto (15 min) e Refresh Token rotativo no Redis.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Email e Senha são obrigatórios." });
        }

        // Validação segura contra a base de usuários e verificação PBKDF2
        var user = await _authUserService.FindByEmailAsync(request.Email, ct);
        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Tentativa de login falhou: credenciais inválidas para '{Email}'.", request.Email);
            return Unauthorized(new { error = "Credenciais inválidas." });
        }

        // Validação anti-BOLA: impede que o chamador force um RestauranteId que não pertence à sua conta
        if (request.RestauranteId.HasValue && request.RestauranteId.Value != user.RestauranteId)
        {
            _logger.LogCritical(
                "VIOLAÇÃO DE SEGURANÇA (BOLA): Usuário '{Email}' vinculado ao restaurante '{UserTenant}' tentou autenticar para '{RequestedTenant}'.",
                user.Email, user.RestauranteId, request.RestauranteId.Value);

            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.3",
                title = "Acesso Negado ao Inquilino",
                status = StatusCodes.Status403Forbidden,
                detail = "O usuário autenticado não possui vínculo com o restaurante informado."
            });
        }

        var userId = user.UserId;
        var restauranteId = user.RestauranteId;

        var tokenResult = _tokenGenerator.GenerateToken(
            userId: userId,
            restauranteId: restauranteId,
            email: user.Email,
            role: user.Role,
            lifetime: TimeSpan.FromMinutes(15) // Access Token higiênico e curto
        );

        var refreshToken = await _refreshTokenService.CreateRefreshTokenAsync(
            userId: userId,
            restauranteId: restauranteId,
            ct: ct
        );

        _logger.LogInformation("Sessão iniciada com sucesso para '{Email}' (Tenant: {TenantId}, Jti: {Jti}).",
            user.Email, restauranteId, tokenResult.Jti);

        return Ok(new LoginResponse(
            Token: tokenResult.Token,
            RefreshToken: refreshToken,
            Jti: tokenResult.Jti,
            ExpiresAt: tokenResult.ExpiresAt,
            RestauranteId: restauranteId,
            UserId: userId
        ));
    }

    /// <summary>
    /// Endpoint de renovação de sessão: consome o Refresh Token anterior, valida a família (Token Family)
    /// e emite um novo par (Access Token de 15 min + novo Refresh Token). Em caso de reúso suspeito, bloqueia a sessão.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { error = "RefreshToken é obrigatório." });
        }

        var (success, userId, restauranteId, familyId) = await _refreshTokenService.RotateRefreshTokenAsync(request.RefreshToken, ct);
        if (!success)
        {
            return Unauthorized(new
            {
                type = "https://datatracker.ietf.org/doc/html/rfc6749#section-5.2",
                title = "Refresh Token Inválido ou Reutilizado",
                status = StatusCodes.Status401Unauthorized,
                detail = "O token de renovação informado é inválido, expirou ou foi reutilizado indevidamente. Por segurança, a sessão foi encerrada."
            });
        }

        var newToken = _tokenGenerator.GenerateToken(
            userId: userId,
            restauranteId: restauranteId,
            email: "sessao@restaurante.com",
            role: "Manager",
            lifetime: TimeSpan.FromMinutes(15)
        );

        var newRefreshToken = await _refreshTokenService.CreateRefreshTokenAsync(
            userId: userId,
            restauranteId: restauranteId,
            familyId: familyId,
            ct: ct
        );

        _logger.LogInformation("Sessão renovada com sucesso para família '{FamilyId}' (UserId: {UserId}).", familyId, userId);

        return Ok(new RefreshTokenResponse(
            Token: newToken.Token,
            RefreshToken: newRefreshToken,
            Jti: newToken.Jti,
            ExpiresAt: newToken.ExpiresAt
        ));
    }

    /// <summary>
    /// Endpoint de logout seguro: revoga o token JWT ativo adicionando seu jti à Blacklist no Redis
    /// e opcionalmente invalida a família do Refresh Token.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest? request, CancellationToken ct)
    {
        var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        if (string.IsNullOrWhiteSpace(jti))
        {
            return BadRequest(new { error = "Claim 'jti' ausente no token autenticado." });
        }

        // Extrai o timestamp de expiração (exp) do token
        var expClaim = User.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;
        var remainingTtl = TimeSpan.Zero;

        if (long.TryParse(expClaim, out var expSeconds))
        {
            var expTime = DateTimeOffset.FromUnixTimeSeconds(expSeconds);
            var delta = expTime - DateTimeOffset.UtcNow;
            if (delta > TimeSpan.Zero)
            {
                remainingTtl = delta;
            }
        }

        // Se o token já expirou, a inclusão na blacklist é desnecessária
        if (remainingTtl > TimeSpan.Zero)
        {
            await _blacklistService.RevokeTokenAsync(jti, remainingTtl, ct);
        }
        else
        {
            _logger.LogDebug("Token '{Jti}' já expirado. Inclusão na Blacklist dispensada.", jti);
        }

        // Se informou o Refresh Token no logout, invalida também a família correspondente
        if (!string.IsNullOrWhiteSpace(request?.RefreshToken))
        {
            var (success, _, _, familyId) = await _refreshTokenService.RotateRefreshTokenAsync(request.RefreshToken, ct);
            if (!string.IsNullOrWhiteSpace(familyId))
            {
                await _refreshTokenService.InvalidateFamilyAsync(familyId, ct);
            }
        }

        _logger.LogInformation("Token '{Jti}' processado para logout com sucesso.", jti);

        return Ok(new
        {
            message = "Logout realizado com sucesso. O token foi revogado na Blacklist do Redis.",
            jti,
            revokedAt = DateTimeOffset.UtcNow,
            ttlRestanteSegundos = (int)remainingTtl.TotalSeconds
        });
    }
}

public sealed record LoginRequest(string Email, string Password, Guid? RestauranteId = null);
public sealed record LoginResponse(string Token, string RefreshToken, string Jti, DateTimeOffset ExpiresAt, Guid RestauranteId, Guid UserId);
public sealed record RefreshTokenRequest(string RefreshToken);
public sealed record RefreshTokenResponse(string Token, string RefreshToken, string Jti, DateTimeOffset ExpiresAt);
public sealed record LogoutRequest(string? RefreshToken = null);
