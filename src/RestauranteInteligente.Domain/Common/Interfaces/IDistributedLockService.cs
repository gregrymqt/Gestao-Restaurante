namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato de bloqueio distribuído com semântica de liberação atômica por token de posse (ownership token).
/// </summary>
public interface IDistributedLockService
{
    /// <summary>
    /// Tenta adquirir um lock distribuído para um recurso específico de um tenant.
    /// Retorna um IAsyncDisposable caso o lock seja obtido, ou null caso o lock expire ou esteja retido por outro processo.
    /// </summary>
    /// <param name="tenantId">Identificador do tenant para isolamento de chave.</param>
    /// <param name="resourceKey">Identificador do recurso a ser protegido.</param>
    /// <param name="ttl">Tempo de vida máximo do lock antes de expirar por segurança.</param>
    /// <param name="acquireTimeout">Tempo máximo de espera tentando adquirir o lock.</param>
    /// <param name="ct">Token de cancelamento cooperativo.</param>
    Task<IAsyncDisposable?> TryAcquireLockAsync(
        Guid tenantId,
        string resourceKey,
        TimeSpan ttl,
        TimeSpan acquireTimeout,
        CancellationToken ct = default);
}
