using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using RestauranteInteligente.Infrastructure.Security;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class WebhookSignatureValidatorTests
{
    private const string SecretKey = "chave_secreta_webhook_teste_123!";
    private readonly WebhookSignatureValidator _validator;

    public WebhookSignatureValidatorTests()
    {
        _validator = new WebhookSignatureValidator(NullLogger<WebhookSignatureValidator>.Instance);
    }

    [Fact]
    public void ValidateSignature_ComAssinaturaValidaETimestampRecente_DeveRetornarTrue()
    {
        var payload = "{\"event\":\"payment.created\",\"id\":12345}";
        var nowSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var messageToSign = $"{nowSeconds}.{payload}";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SecretKey));
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(messageToSign))).ToLowerInvariant();
        var signatureHeader = $"t={nowSeconds},v1={hash}";

        var isValid = _validator.ValidateSignature(payload, signatureHeader, SecretKey, TimeSpan.FromMinutes(5));

        isValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateSignature_ComPayloadAdulterado_DeveRetornarFalse()
    {
        var originalPayload = "{\"event\":\"payment.created\",\"id\":12345}";
        var tamperedPayload = "{\"event\":\"payment.created\",\"id\":99999}"; // ADULTERADO
        var nowSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var messageToSign = $"{nowSeconds}.{originalPayload}";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SecretKey));
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(messageToSign))).ToLowerInvariant();
        var signatureHeader = $"t={nowSeconds},v1={hash}";

        var isValid = _validator.ValidateSignature(tamperedPayload, signatureHeader, SecretKey, TimeSpan.FromMinutes(5));

        isValid.Should().BeFalse();
    }

    [Fact]
    public void ValidateSignature_ComTimestampComDriftExcessivo_DeveRetornarFalseContraReplayAttack()
    {
        var payload = "{\"event\":\"payment.created\",\"id\":12345}";
        var oldSeconds = DateTimeOffset.UtcNow.AddMinutes(-10).ToUnixTimeSeconds(); // 10 MINUTOS ATRÁS
        var messageToSign = $"{oldSeconds}.{payload}";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SecretKey));
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(messageToSign))).ToLowerInvariant();
        var signatureHeader = $"t={oldSeconds},v1={hash}";

        var isValid = _validator.ValidateSignature(payload, signatureHeader, SecretKey, TimeSpan.FromMinutes(5));

        isValid.Should().BeFalse();
    }
}
