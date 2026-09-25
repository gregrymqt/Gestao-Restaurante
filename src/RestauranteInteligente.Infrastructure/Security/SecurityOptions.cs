namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Opções de segurança para autenticação entre serviços internos e integrações máquina-a-máquina.
/// </summary>
public sealed class SecurityOptions
{
    public const string SectionName = "Security";

    /// <summary>
    /// Chave de API pré-compartilhada para requisições de serviço que informam X-Tenant-Id fora de tokens JWT.
    /// </summary>
    public string InternalServiceApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Segredo HMAC para validação de webhooks do Mercado Pago.
    /// </summary>
    public string MercadoPagoWebhookSecret { get; set; } = string.Empty;
}
