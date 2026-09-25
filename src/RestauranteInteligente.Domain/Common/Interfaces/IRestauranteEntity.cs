namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato canônico para entidades segregadas por Multi-Tenancy.
/// </summary>
public interface IRestauranteEntity
{
    Guid RestauranteId { get; }
}
