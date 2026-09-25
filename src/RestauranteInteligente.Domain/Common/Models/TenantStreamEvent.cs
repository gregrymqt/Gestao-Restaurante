namespace RestauranteInteligente.Domain.Common.Models;

/// <summary>
/// Evento transmitido em tempo real via Redis Pub/Sub e Server-Sent Events (SSE).
/// </summary>
public sealed record TenantStreamEvent(
    string EventType,
    string PayloadJson,
    DateTimeOffset Timestamp,
    Guid CorrelationId
);
