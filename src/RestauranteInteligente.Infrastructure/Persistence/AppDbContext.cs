using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Persistence.Interceptors;

namespace RestauranteInteligente.Infrastructure.Persistence;

/// <summary>
/// Contexto do Entity Framework Core com segregação de inquilinos em duas camadas:
/// 1. Camada de Aplicação: Global Query Filters (HasQueryFilter) para todas as entidades IRestauranteEntity.
/// 2. Camada de Banco: Interceptor transacional acionando PostgreSQL Row-Level Security (RLS).
/// Garante também a imutabilidade do Livro-Razão de estoque (proibição de UPDATE/DELETE em MovimentacoesEstoque).
/// </summary>
public sealed class AppDbContext : DbContext, IAppDbContext
{
    private readonly ITenantContext _tenantContext;
    private readonly PostgresRlsTransactionInterceptor? _rlsInterceptor;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        ITenantContext tenantContext,
        PostgresRlsTransactionInterceptor? rlsInterceptor = null)
        : base(options)
    {
        _tenantContext = tenantContext;
        _rlsInterceptor = rlsInterceptor;
    }

    public DbSet<Restaurante> Restaurantes => Set<Restaurante>();
    public DbSet<Insumo> Insumos => Set<Insumo>();
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<MovimentacaoEstoque> MovimentacoesEstoque => Set<MovimentacaoEstoque>();

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return Database.BeginTransactionAsync(cancellationToken);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        if (_rlsInterceptor != null)
        {
            optionsBuilder.AddInterceptors(_rlsInterceptor);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Aplicação automática de Global Query Filter para toda entidade IRestauranteEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IRestauranteEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(AppDbContext)
                    .GetMethod(nameof(ConfigureTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)?
                    .MakeGenericMethod(entityType.ClrType);

                method?.Invoke(this, new object[] { modelBuilder });
            }
        }
    }

    private void ConfigureTenantFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : class, IRestauranteEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => !_tenantContext.HasTenant || e.RestauranteId == _tenantContext.RestauranteId);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // 1. Guardrail Inegociável: Imutabilidade do Livro-Razão de Estoque (Append-Only)
        foreach (var entry in ChangeTracker.Entries<MovimentacaoEstoque>())
        {
            if (entry.State == EntityState.Modified || entry.State == EntityState.Deleted)
            {
                throw new InvalidOperationException(
                    "VIOLAÇÃO DE INVARIANTE: A tabela 'MovimentacoesEstoque' é um ledger estritamente imutável (append-only). " +
                    "Operações de UPDATE ou DELETE são categoricamente proibidas. Para correções, efetue um novo lançamento compensatório (Tipo = AJUSTE).");
            }
        }

        // 2. Injeção automática e segura do RestauranteId em novas entidades caso esteja em contexto
        if (_tenantContext.HasTenant)
        {
            var tenantId = _tenantContext.RestauranteId;
            foreach (var entry in ChangeTracker.Entries<IRestauranteEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity.RestauranteId == Guid.Empty)
                    {
                        var property = entry.Property(nameof(IRestauranteEntity.RestauranteId));
                        property.CurrentValue = tenantId;
                    }
                    else if (entry.Entity.RestauranteId != tenantId)
                    {
                        throw new InvalidOperationException(
                            $"VIOLAÇÃO DE SEGURANÇA: Tentativa de persistir entidade com RestauranteId '{entry.Entity.RestauranteId}' " +
                            $"divergente do tenant ativo '{tenantId}' no contexto.");
                    }
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
