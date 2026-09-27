using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Common.Interfaces;

/// <summary>
/// Contrato do contexto de dados do Entity Framework Core com segregação de inquilinos.
/// </summary>
public interface IAppDbContext
{
    DbSet<Restaurante> Restaurantes { get; }
    DbSet<Insumo> Insumos { get; }
    DbSet<Produto> Produtos { get; }
    DbSet<MovimentacaoEstoque> MovimentacoesEstoque { get; }

    DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
