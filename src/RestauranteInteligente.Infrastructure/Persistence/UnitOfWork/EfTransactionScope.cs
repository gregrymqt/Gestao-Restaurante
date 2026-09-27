using Microsoft.EntityFrameworkCore.Storage;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Infrastructure.Persistence.UnitOfWork;

/// <summary>
/// Encapsulamento de IDbContextTransaction compatível com a interface agnóstica ITransactionScope.
/// Garante que detalhes de transação do EF Core não vazem para a camada de Domínio ou Aplicação.
/// </summary>
public sealed class EfTransactionScope : ITransactionScope
{
    private readonly IDbContextTransaction _transaction;
    private bool _isDisposed;

    public EfTransactionScope(IDbContextTransaction transaction)
    {
        _transaction = transaction ?? throw new ArgumentNullException(nameof(transaction));
    }

    public async Task CommitAsync(CancellationToken ct = default)
    {
        await _transaction.CommitAsync(ct);
    }

    public async Task RollbackAsync(CancellationToken ct = default)
    {
        await _transaction.RollbackAsync(ct);
    }

    public async ValueTask DisposeAsync()
    {
        if (!_isDisposed)
        {
            await _transaction.DisposeAsync();
            _isDisposed = true;
        }
    }
}
