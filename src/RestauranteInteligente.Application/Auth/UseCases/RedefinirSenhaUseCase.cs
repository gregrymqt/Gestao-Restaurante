using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Auth.UseCases;

/// <summary>
/// Caso de uso para validação do código OTP de 6 dígitos e redefinição final de senha do operador.
/// </summary>
public sealed class RedefinirSenhaUseCase
{
    private readonly IPasswordResetTokenService _tokenService;
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<RedefinirSenhaUseCase> _logger;

    public RedefinirSenhaUseCase(
        IPasswordResetTokenService tokenService,
        IUsuarioRepository usuarioRepository,
        IPasswordHasher passwordHasher,
        ILogger<RedefinirSenhaUseCase> logger)
    {
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ExecutarAsync(string? email, string? codigoOtp, string? novaSenha, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new ArgumentException("E-mail corporativo válido é obrigatório.", nameof(email));

        if (string.IsNullOrWhiteSpace(codigoOtp) || codigoOtp.Trim().Length != 6)
            throw new ArgumentException("O código OTP deve conter exatamente 6 dígitos.", nameof(codigoOtp));

        if (string.IsNullOrWhiteSpace(novaSenha) || novaSenha.Length < 6)
            throw new ArgumentException("A nova senha deve possuir no mínimo 6 caracteres.", nameof(novaSenha));

        var normalizedEmail = email.Trim().ToLowerInvariant();

        // Valida e consome atomicamente o OTP para impedir replay
        var otpValido = await _tokenService.ValidarEConsumirOtpAsync(normalizedEmail, codigoOtp.Trim(), ct);
        if (!otpValido)
        {
            _logger.LogWarning("Falha na redefinição de senha para '{Email}': OTP inválido ou expirado.", normalizedEmail);
            throw new InvalidOperationException("Código de recuperação inválido ou expirado.");
        }

        var usuario = await _usuarioRepository.ObterPorEmailAsync(normalizedEmail, ct);
        if (usuario == null)
            throw new KeyNotFoundException("Usuário não localizado no sistema.");

        var novaSenhaHash = _passwordHasher.HashPassword(novaSenha);
        usuario.AtualizarSenha(novaSenhaHash);
        await _usuarioRepository.AtualizarAsync(usuario, ct);

        _logger.LogInformation("Senha do usuário '{Email}' redefinida com sucesso.", normalizedEmail);
    }
}
