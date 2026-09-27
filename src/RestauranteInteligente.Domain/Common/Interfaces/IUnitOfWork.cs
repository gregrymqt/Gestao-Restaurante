namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato de Unit of Work para controle atômico de transações e persistência de alterações.
/// </summary>
public interface IUnitOfWork
{
    Task<ITransactionScope> BeginTransactionAsync(CancellationToken ct = default);
    Task<int> CommitAsync(CancellationToken ct = default);
}
