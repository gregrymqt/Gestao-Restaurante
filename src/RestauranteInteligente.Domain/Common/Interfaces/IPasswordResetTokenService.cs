namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato canônico para geração, armazenamento volátil e consumo de códigos OTP de recuperação de senha.
/// </summary>
public interface IPasswordResetTokenService
{
    /// <summary>
    /// Gera um código numérico de 6 dígitos criptograficamente seguro e persiste temporariamente no storage volátil.
    /// </summary>
    Task<string> GerarOtpAsync(string email, TimeSpan ttl, CancellationToken ct = default);

    /// <summary>
    /// Valida o código OTP informado contra a chave de e-mail e consome o token atomicamente para impedir reúso.
    /// </summary>
    Task<bool> ValidarEConsumirOtpAsync(string email, string otp, CancellationToken ct = default);
}
