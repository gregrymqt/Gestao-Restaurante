using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Validador criptográfico de assinaturas HMAC-SHA256 para Webhooks externos (ex: Mercado Pago, gateways de pagamento).
/// Protegido contra Timing Attacks via CryptographicOperations.FixedTimeEquals e Replay Attacks via checagem de timestamp.
/// </summary>
public sealed class WebhookSignatureValidator : IWebhookSignatureValidator
{
    private readonly ILogger<WebhookSignatureValidator> _logger;

    public WebhookSignatureValidator(ILogger<WebhookSignatureValidator> logger)
    {
        _logger = logger;
    }

    public bool ValidateSignature(string payload, string signatureHeader, string secretKey, TimeSpan maxDrift)
    {
        if (string.IsNullOrWhiteSpace(payload) || string.IsNullOrWhiteSpace(signatureHeader) || string.IsNullOrWhiteSpace(secretKey))
        {
            _logger.LogWarning("Validação de Webhook rejeitada: payload, cabeçalho de assinatura ou secretKey vazios.");
            return false;
        }

        var (timestamp, receivedHash) = ExtractTimestampAndHash(signatureHeader);

        // 1. Prevenção contra Replay Attacks via validação temporal de drift
        if (timestamp.HasValue)
        {
            var drift = DateTimeOffset.UtcNow - timestamp.Value;
            if (Math.Abs(drift.TotalSeconds) > maxDrift.TotalSeconds)
            {
                _logger.LogWarning(
                    "Replay attack potencial: o timestamp do webhook ({Timestamp}) possui desvio de {DriftSec}s em relação ao relógio do servidor (limite: {MaxDriftSec}s).",
                    timestamp.Value, drift.TotalSeconds, maxDrift.TotalSeconds);
                return false;
            }
        }

        // 2. Montagem da mensagem canônica a ser autenticada
        var messageToSign = timestamp.HasValue
            ? $"{timestamp.Value.ToUnixTimeSeconds()}.{payload}"
            : payload;

        // 3. Computação da assinatura HMAC-SHA256
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var computedBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(messageToSign));
        var computedHex = Convert.ToHexString(computedBytes).ToLowerInvariant();

        var receivedBytes = Encoding.UTF8.GetBytes(receivedHash.ToLowerInvariant());
        var expectedBytes = Encoding.UTF8.GetBytes(computedHex);

        if (receivedBytes.Length != expectedBytes.Length)
        {
            _logger.LogWarning("Tamanho da assinatura HMAC fornecida no webhook diverge do esperado.");
            return false;
        }

        // 4. Comparação em tempo constante para neutralizar Timing Attacks
        var isValid = CryptographicOperations.FixedTimeEquals(receivedBytes, expectedBytes);
        if (!isValid)
        {
            _logger.LogWarning("Assinatura HMAC-SHA256 do webhook inválida. Rejeitando requisição.");
        }

        return isValid;
    }

    private static (DateTimeOffset? Timestamp, string Hash) ExtractTimestampAndHash(string header)
    {
        // Trata formatos: "t=1711234567,v1=abc..." ou "ts=1711234567;v1=abc..." ou chave direta "v1=abc..."
        DateTimeOffset? timestamp = null;
        var hash = header.Trim();

        var parts = header.Split([',', ';'], StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in parts)
        {
            var keyValue = part.Trim().Split('=', 2);
            if (keyValue.Length != 2) continue;

            var key = keyValue[0].Trim().ToLowerInvariant();
            var val = keyValue[1].Trim();

            if ((key == "t" || key == "ts") && long.TryParse(val, out var unixSeconds))
            {
                timestamp = DateTimeOffset.FromUnixTimeSeconds(unixSeconds);
            }
            else if (key == "v1" || key == "sha256")
            {
                hash = val;
            }
        }

        return (timestamp, hash);
    }
}
