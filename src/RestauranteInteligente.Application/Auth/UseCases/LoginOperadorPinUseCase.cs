using RestauranteInteligente.Application.Auth.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Auth.UseCases;

/// <summary>
/// Caso de uso para autenticação rápida de operador de frente de caixa via PIN de 4 dígitos.
/// </summary>
public sealed class LoginOperadorPinUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;
    private readonly IRefreshTokenService _refreshTokenService;

    public LoginOperadorPinUseCase(
        IUsuarioRepository usuarioRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator,
        IRefreshTokenService refreshTokenService)
    {
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        _tokenGenerator = tokenGenerator ?? throw new ArgumentNullException(nameof(tokenGenerator));
        _refreshTokenService = refreshTokenService ?? throw new ArgumentNullException(nameof(refreshTokenService));
    }

    public async Task<LoginOperadorPinResponseDto> ExecutarAsync(LoginOperadorPinRequestDto request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.RestauranteId == Guid.Empty)
            throw new ArgumentException("O ID do restaurante é obrigatório.", nameof(request.RestauranteId));

        if (request.UsuarioId == Guid.Empty)
            throw new ArgumentException("O ID do usuário é obrigatório.", nameof(request.UsuarioId));

        if (string.IsNullOrWhiteSpace(request.Pin) || request.Pin.Length != 4 || !request.Pin.All(char.IsDigit))
            throw new ArgumentException("O PIN deve conter exatamente 4 dígitos numéricos.", nameof(request.Pin));

        var usuario = await _usuarioRepository.ObterPorIdAsync(request.UsuarioId, ct);
        if (usuario == null || !usuario.Ativo || usuario.RestauranteId != request.RestauranteId)
            throw new UnauthorizedAccessException("Operador não encontrado, inativo ou não pertence a esta unidade.");

        bool pinValido;
        if (string.IsNullOrWhiteSpace(usuario.PinHash))
        {
            // Fallback de transição para operadores legados sem PIN definido
            pinValido = request.Pin.Trim() == "1234";
        }
        else
        {
            pinValido = _passwordHasher.VerifyPassword(request.Pin.Trim(), usuario.PinHash);
        }

        if (!pinValido)
            throw new UnauthorizedAccessException("PIN inválido.");

        var tokenResult = _tokenGenerator.GenerateToken(
            userId: usuario.Id,
            restauranteId: usuario.RestauranteId,
            email: usuario.Email,
            role: usuario.Role,
            nome: usuario.Nome,
            lifetime: TimeSpan.FromHours(10)
        );

        var refreshToken = await _refreshTokenService.CreateRefreshTokenAsync(
            userId: usuario.Id,
            restauranteId: usuario.RestauranteId,
            ct: ct
        );

        return new LoginOperadorPinResponseDto(
            Token: tokenResult.Token,
            RefreshToken: refreshToken,
            UsuarioId: usuario.Id,
            Nome: usuario.Nome,
            Role: usuario.Role,
            RestauranteId: usuario.RestauranteId
        );
    }
}
