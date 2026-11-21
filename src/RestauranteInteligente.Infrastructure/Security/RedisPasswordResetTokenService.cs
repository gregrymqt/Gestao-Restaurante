using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Serviço de infraestrutura para geração e consumo atômico de OTPs no Redis para redefinição de senhas.
/// </summary>
public sealed class RedisPasswordResetTokenService : IPasswordResetTokenService
{
    private readonly IRedisConnectionFactory _connectionFactory;
    private readonly ILogger<RedisPasswordResetTokenService> _logger;

    public RedisPasswordResetTokenService(
        IRedisConnectionFactory connectionFactory,
        ILogger<RedisPasswordResetTokenService> logger)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<string> GerarOtpAsync(string email, TimeSpan ttl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("E-mail é obrigatório para geração de OTP.", nameof(email));

        ct.ThrowIfCancellationRequested();

        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var key = RedisKeyHelper.BuildPasswordResetKey(email);
        var db = _connectionFactory.GetDatabase();

        await db.StringSetAsync(key, otp, ttl);
        _logger.LogInformation("OTP de redefinição de senha gerado para '{Email}' com validade de {TtlMinutes} minutos.", email, ttl.TotalMinutes);

        return otp;
    }

    public async Task<bool> ValidarEConsumirOtpAsync(string email, string otp, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otp))
            return false;

        ct.ThrowIfCancellationRequested();

        var key = RedisKeyHelper.BuildPasswordResetKey(email);
        var db = _connectionFactory.GetDatabase();
        var storedOtp = await db.StringGetAsync(key);

        if (storedOtp.IsNullOrEmpty || storedOtp.ToString() != otp.Trim())
        {
            _logger.LogWarning("Tentativa de consumo de OTP inválido ou expirado para '{Email}'.", email);
            return false;
        }

        // Deleta o token imediatamente para impedir ataque de replay
        await db.KeyDeleteAsync(key);
        _logger.LogInformation("OTP validado e consumido com sucesso para '{Email}'.", email);
        return true;
    }
}
