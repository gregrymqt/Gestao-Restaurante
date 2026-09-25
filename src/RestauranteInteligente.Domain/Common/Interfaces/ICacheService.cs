namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato canônico de cache volátil (SafeCache) com isolamento automático por TenantId.
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(Guid tenantId, string key, CancellationToken ct = default);
    Task SetAsync<T>(Guid tenantId, string key, T value, TimeSpan ttl, CancellationToken ct = default);
    Task RemoveAsync(Guid tenantId, string key, CancellationToken ct = default);
}
