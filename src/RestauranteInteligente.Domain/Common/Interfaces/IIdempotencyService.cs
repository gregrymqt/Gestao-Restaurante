namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato de idempotência distribuída para descarte atômico de duplicidades (mensagens e webhooks).
/// </summary>
public interface IIdempotencyService
{
    /// <summary>
    /// Tenta adquirir atomicamente o direito exclusivo de processamento para a chave no escopo do tenant.
    /// Retorna true se adquirido com sucesso; false se a operação já está em processamento ou concluída.
    /// </summary>
    Task<bool> TryAcquireAsync(Guid tenantId, string operationKey, TimeSpan ttl, CancellationToken ct = default);

    /// <summary>
    /// Marca a operação como processada com sucesso, garantindo retenção para deduplicação subsequente.
    /// </summary>
    Task MarkCompletedAsync(Guid tenantId, string operationKey, TimeSpan retentionTtl, CancellationToken ct = default);

    /// <summary>
    /// Libera a chave em caso de erro transitório para permitir reprocessamento.
    /// </summary>
    Task ReleaseAsync(Guid tenantId, string operationKey, CancellationToken ct = default);
}
