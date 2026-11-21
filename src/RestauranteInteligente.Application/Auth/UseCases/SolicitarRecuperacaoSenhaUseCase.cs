using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Auth.UseCases;

public sealed record SolicitarRecuperacaoSenhaResult(string Mensagem, int ExpiracaoMinutos);

/// <summary>
/// Caso de uso para solicitação de recuperação de senha gerando OTP volátil de 6 dígitos via serviço de cache.
/// </summary>
public sealed class SolicitarRecuperacaoSenhaUseCase
{
    private readonly IAuthUserService _authUserService;
    private readonly IPasswordResetTokenService _tokenService;
    private readonly ILogger<SolicitarRecuperacaoSenhaUseCase> _logger;

    public SolicitarRecuperacaoSenhaUseCase(
        IAuthUserService authUserService,
        IPasswordResetTokenService tokenService,
        ILogger<SolicitarRecuperacaoSenhaUseCase> logger)
    {
        _authUserService = authUserService ?? throw new ArgumentNullException(nameof(authUserService));
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<SolicitarRecuperacaoSenhaResult> ExecutarAsync(string? email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new ArgumentException("E-mail corporativo válido é obrigatório.", nameof(email));

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _authUserService.FindByEmailAsync(normalizedEmail, ct);

        // Se o usuário existir, gera OTP volátil válido por 15 minutos
        if (user != null)
        {
            var otp = await _tokenService.GerarOtpAsync(normalizedEmail, TimeSpan.FromMinutes(15), ct);
            _logger.LogInformation("Código de recuperação gerado para o usuário '{Email}': [OTP={Otp}].", normalizedEmail, otp);
        }
        else
        {
            _logger.LogWarning("Tentativa de recuperação de senha para e-mail inexistente '{Email}'.", normalizedEmail);
        }

        // Resposta padronizada anti-enumeração de usuários
        return new SolicitarRecuperacaoSenhaResult(
            Mensagem: "Se o e-mail informado estiver cadastrado no sistema, um código de verificação de 6 dígitos foi gerado.",
            ExpiracaoMinutos: 15
        );
    }
}
