namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato canônico para validação criptográfica de assinaturas HMAC-SHA256 em Webhooks externos.
/// </summary>
public interface IWebhookSignatureValidator
{
    /// <summary>
    /// Valida a assinatura HMAC-SHA256 comparando em tempo constante (contra timing attacks)
    /// e verificando a janela de expiração do timestamp (contra replay attacks).
    /// </summary>
    /// <param name="payload">Corpo cru da requisição HTTP (raw body).</param>
    /// <param name="signatureHeader">Cabeçalho com a assinatura e timestamp (ex: "t=1711234567,v1=abc...").</param>
    /// <param name="secretKey">Chave secreta compartilhada com o gateway.</param>
    /// <param name="maxDrift">Desvio máximo aceitável entre o timestamp do webhook e o relógio UTC do servidor.</param>
    bool ValidateSignature(string payload, string signatureHeader, string secretKey, TimeSpan maxDrift);
}
