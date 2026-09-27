namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Escopo transacional agnóstico de infraestrutura que suporta 'await using'.
/// Permite confirmação (commit) ou reversão (rollback) atômica de operações.
/// </summary>
public interface ITransactionScope : IAsyncDisposable
{
    Task CommitAsync(CancellationToken ct = default);
    Task RollbackAsync(CancellationToken ct = default);
}
