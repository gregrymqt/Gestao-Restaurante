using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Route("api/v1/webhooks")]
public sealed class WebhooksController : ControllerBase
{
    private const string DefaultWebhookSecret = "mp_secret_webhook_key_2026_segura!#";
    private readonly IWebhookSignatureValidator _signatureValidator;
    private readonly IIdempotencyService _idempotencyService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        IWebhookSignatureValidator signatureValidator,
        IIdempotencyService idempotencyService,
        ILogger<WebhooksController> logger)
    {
        _signatureValidator = signatureValidator;
        _idempotencyService = idempotencyService;
        _logger = logger;
    }

    /// <summary>
    /// Endpoint para recepção de notificações de pagamento e recargas externas (ex: Mercado Pago).
    /// Valida criptograficamente a assinatura HMAC-SHA256 e assegura idempotência atômica no Redis.
    /// </summary>
    [HttpPost("mercadopago")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveMercadoPagoWebhook(CancellationToken ct)
    {
        // 1. Extração do cabeçalho de assinatura
        if (!Request.Headers.TryGetValue("x-signature", out var signatureValues) &&
            !Request.Headers.TryGetValue("X-Signature", out signatureValues))
        {
            _logger.LogWarning("Webhook recebido sem o cabeçalho obrigatório de assinatura HMAC (x-signature).");
            return Unauthorized(new { error = "Cabeçalho de assinatura 'x-signature' é obrigatório." });
        }

        var signatureHeader = signatureValues.ToString();

        // 2. Leitura segura do raw body
        Request.EnableBuffering();
        Request.Body.Position = 0;
        using var reader = new StreamReader(Request.Body, leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync(ct);
        Request.Body.Position = 0;

        // 3. Validação Criptográfica HMAC-SHA256 com proteção contra timing attack e replay
        var isValid = _signatureValidator.ValidateSignature(
            payload: rawBody,
            signatureHeader: signatureHeader,
            secretKey: DefaultWebhookSecret,
            maxDrift: TimeSpan.FromMinutes(5)
        );

        if (!isValid)
        {
            _logger.LogWarning("Assinatura HMAC inválida ou timestamp expirado no webhook do Mercado Pago.");
            return Unauthorized(new { error = "Assinatura HMAC inválida ou timestamp expirado." });
        }

        // 4. Extração do ID do evento para deduplicação
        var eventId = ExtractEventId(rawBody);
        var globalTenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        // 5. Garantia de Idempotência Atômica no Redis (SET NX EX)
        var isNewEvent = await _idempotencyService.TryAcquireAsync(
            tenantId: globalTenantId,
            operationKey: $"webhook:mercadopago:{eventId}",
            ttl: TimeSpan.FromHours(24),
            ct: ct
        );

        if (!isNewEvent)
        {
            _logger.LogInformation("Webhook duplicado detectado para o evento '{EventId}'. Resposta 200 OK idempotente emitida.", eventId);
            return Ok(new { status = "Evento duplicado já processado anteriormente. Descarte idempotente." });
        }

        _logger.LogInformation("Webhook do Mercado Pago autenticado e aceito com sucesso para o evento '{EventId}'.", eventId);
        return Ok(new { status = "Webhook processado com sucesso.", eventId });
    }

    private static string ExtractEventId(string rawJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(rawJson);
            if (doc.RootElement.TryGetProperty("id", out var idProp))
            {
                return idProp.ToString();
            }

            if (doc.RootElement.TryGetProperty("data", out var dataProp) &&
                dataProp.TryGetProperty("id", out var dataIdProp))
            {
                return dataIdProp.ToString();
            }
        }
        catch
        {
            // Fallback para hash seguro caso o JSON não tenha id estruturado
        }

        return Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawJson))).ToLowerInvariant()[..16];
    }
}
