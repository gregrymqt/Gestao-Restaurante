// ==============================================================================
// Manual Canónico de Engenharia de Dados: PostgreSQL 16
// Implementação Canônica em C# (.NET 8/9 EF Core)
// Interceptor Npgsql para Row-Level Security (RLS) e Global Query Filters
// ==============================================================================

using System;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace RestauranteInteligente.Infrastructure.Persistence;

/// <summary>
/// Contrato para resolução do identificador do inquilino (RestauranteId) no contexto da requisição atual.
/// </summary>
public interface ITenantContext
{
    Guid? RestauranteId { get; }
    void DefinirRestaurante(Guid restauranteId);
}

public class TenantContext : ITenantContext
{
    public Guid? RestauranteId { get; private set; }

    public void DefinirRestaurante(Guid restauranteId)
    {
        RestauranteId = restauranteId;
    }
}

/// <summary>
/// Interceptor de transações do EF Core para injetar a variável de sessão do PostgreSQL:
/// SET LOCAL app.current_restaurante_id = '{RestauranteId}'
/// 
/// O uso de 'SET LOCAL' garante que a configuração tenha escopo restrito à transação ativa,
/// eliminando riscos de contaminação do pool de conexões do Npgsql.
/// </summary>
public class PostgresRlsTransactionInterceptor : DbTransactionInterceptor
{
    private readonly ITenantContext _tenantContext;

    public PostgresRlsTransactionInterceptor(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    public override async Task TransactionStartedAsync(
        DbTransaction transaction,
        TransactionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        await ConfigurarSessaoRlsAsync(transaction.Connection, transaction, cancellationToken);
        await base.TransactionStartedAsync(transaction, eventData, cancellationToken);
    }

    public override void TransactionStarted(
        DbTransaction transaction,
        TransactionEndEventData eventData)
    {
        ConfigurarSessaoRlsAsync(transaction.Connection, transaction, CancellationToken.None).GetAwaiter().GetResult();
        base.TransactionStarted(transaction, eventData);
    }

    private async Task ConfigurarSessaoRlsAsync(
        DbConnection? connection,
        DbTransaction transaction,
        CancellationToken cancellationToken)
    {
        if (connection == null || _tenantContext.RestauranteId == null)
            return;

        await using var cmd = connection.CreateCommand();
        cmd.Transaction = transaction;
        cmd.CommandText = "SELECT set_config('app.current_restaurante_id', @restauranteId, true);";

        var param = cmd.CreateParameter();
        param.ParameterName = "restauranteId";
        param.Value = _tenantContext.RestauranteId.Value.ToString();
        cmd.Parameters.Add(param);

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}

/// <summary>
/// Exemplo canônico de configuração do DbContext com Global Query Filters e registro de interceptor.
/// </summary>
public class RestauranteDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;
    private readonly PostgresRlsTransactionInterceptor _rlsInterceptor;

    public RestauranteDbContext(
        DbContextOptions<RestauranteDbContext> options,
        ITenantContext tenantContext,
        PostgresRlsTransactionInterceptor rlsInterceptor)
        : base(options)
    {
        _tenantContext = tenantContext;
        _rlsInterceptor = rlsInterceptor;
    }

    public DbSet<Insumo> Insumos => Set<Insumo>();
    public DbSet<MovimentacaoEstoque> MovimentacoesEstoque => Set<MovimentacaoEstoque>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        // Registra o interceptor RLS na esteira do EF Core
        optionsBuilder.AddInterceptors(_rlsInterceptor);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplicação do Global Query Filter em todas as entidades IRestauranteEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IRestauranteEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(RestauranteDbContext)
                    .GetMethod(nameof(ConfigureGlobalTenantFilter), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?
                    .MakeGenericMethod(entityType.ClrType);

                method?.Invoke(this, new object[] { modelBuilder });
            }
        }
    }

    private void ConfigureGlobalTenantFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : class, IRestauranteEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => _tenantContext.RestauranteId == null || e.RestauranteId == _tenantContext.RestauranteId);
    }
}
