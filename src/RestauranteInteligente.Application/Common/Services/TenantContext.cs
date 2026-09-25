using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Application.Common.Services;

/// <summary>
/// Implementação escopada para armazenar o TenantId da requisição HTTP ou contexto de mensageria.
/// </summary>
public sealed class TenantContext : ITenantContext
{
    private Guid _restauranteId;
    private bool _hasTenant;

    public Guid RestauranteId => _hasTenant
        ? _restauranteId
        : throw new InvalidOperationException("TenantContext não foi inicializado para a requisição atual.");

    public bool HasTenant => _hasTenant;

    public void SetTenantId(Guid restauranteId)
    {
        if (restauranteId == Guid.Empty)
            throw new ArgumentException("RestauranteId não pode ser vazio.", nameof(restauranteId));

        _restauranteId = restauranteId;
        _hasTenant = true;
    }
}
