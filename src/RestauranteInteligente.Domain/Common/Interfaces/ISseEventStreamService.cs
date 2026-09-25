using RestauranteInteligente.Domain.Common.Models;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato de barramento para eventos em tempo real por inquilino.
/// </summary>
public interface ISseEventStreamService
{
    /// <summary>
    /// Publica um evento no canal Redis do tenant correspondente.
    /// </summary>
    Task PublishAsync(
        Guid tenantId,
        string eventType,
        string payloadJson,
        Guid correlationId = default,
        CancellationToken ct = default);

    /// <summary>
    /// Escuta os eventos publicados para o tenant via Redis Pub/Sub em formato assíncrono contínuo.
    /// </summary>
    IAsyncEnumerable<TenantStreamEvent> SubscribeAsync(
        Guid tenantId,
        CancellationToken ct = default);
}
