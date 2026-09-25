namespace RestauranteInteligente.Application.Common.Interfaces;

/// <summary>
/// Provedor do contexto de execução com o identificador do restaurante ativo na requisição.
/// </summary>
public interface ITenantContext
{
    Guid RestauranteId { get; }
    bool HasTenant { get; }
    void SetTenantId(Guid restauranteId);
}
