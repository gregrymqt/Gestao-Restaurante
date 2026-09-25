// ==============================================================================
// Manual Canónico de Backend: ASP.NET Core (.NET 9 / C# 13)
// Contexto de Persistência Multi-Tenant e Interceptação Segura de Gravação
// ==============================================================================

using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RestauranteInteligente.Domain.Common;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Common.Interfaces;

public interface ICurrentTenantProvider
{
    Guid? RestauranteId { get; }
    bool IsAuthenticated { get; }
}

public interface IAppDbContext
{
    DbSet<Restaurante> Restaurantes { get; }
    DbSet<Produto> Produtos { get; }
    DbSet<Insumo> Insumos { get; }
    DbSet<ProdutoInsumo> ProdutosInsumos { get; }
    DbSet<Venda> Vendas { get; }
    DbSet<ItemVenda> ItensVenda { get; }
    DbSet<MovimentacaoEstoque> MovimentacoesEstoque { get; }

    Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

namespace RestauranteInteligente.Infrastructure.Security;

using RestauranteInteligente.Application.Common.Interfaces;

public sealed class CurrentTenantProvider : ICurrentTenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentTenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? RestauranteId
    {
        get
        {
            var claimsPrincipal = _httpContextAccessor.HttpContext?.User;
            var tenantClaim = claimsPrincipal?.FindFirst("restauranteId")?.Value 
                              ?? claimsPrincipal?.FindFirst("tenantId")?.Value;

            if (Guid.TryParse(tenantClaim, out var restauranteId))
                return restauranteId;

            return null;
        }
    }

    public bool IsAuthenticated => RestauranteId.HasValue;
}

namespace RestauranteInteligente.Infrastructure.Persistence;

using RestauranteInteligente.Application.Common.Interfaces;

public sealed class AppDbContext : DbContext, IAppDbContext
{
    private readonly ICurrentTenantProvider _tenantProvider;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentTenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Restaurante> Restaurantes => Set<Restaurante>();
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Insumo> Insumos => Set<Insumo>();
    public DbSet<ProdutoInsumo> ProdutosInsumos => Set<ProdutoInsumo>();
    public DbSet<Venda> Vendas => Set<Venda>();
    public DbSet<ItemVenda> ItensVenda => Set<ItemVenda>();
    public DbSet<MovimentacaoEstoque> MovimentacoesEstoque => Set<MovimentacaoEstoque>();

    public Guid CurrentTenantId => _tenantProvider.RestauranteId ?? Guid.Empty;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Configuração dinâmica de Global Query Filter para todas as entidades IRestauranteEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IRestauranteEntity).IsAssignableFrom(entityType.ClrType))
            {
                var parameter = Expression.Parameter(entityType.ClrType, "entity");
                var property = Expression.Property(parameter, nameof(IRestauranteEntity.RestauranteId));
                var tenantMethod = Expression.Property(Expression.Constant(this), nameof(CurrentTenantId));
                var filter = Expression.Lambda(Expression.Equal(property, tenantMethod), parameter);

                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
            }
        }
    }

    /// <summary>
    /// Intercepta mutações para garantir que entidades novas recebam o RestauranteId ativo
    /// e impede categoricamente escritas cruzadas entre inquilinos concorrentes.
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var activeTenant = _tenantProvider.RestauranteId;

        if (activeTenant.HasValue && activeTenant.Value != Guid.Empty)
        {
            var trackedEntities = ChangeTracker.Entries<IRestauranteEntity>()
                .Where(e => e.State == EntityState.Added);

            foreach (var entry in trackedEntities)
            {
                var tenantProperty = entry.Property(nameof(IRestauranteEntity.RestauranteId));
                var currentValue = tenantProperty.CurrentValue as Guid?;

                // 1. Se veio vazio (Guid.Empty ou nulo), auto-injeta o inquilino autenticado
                if (!currentValue.HasValue || currentValue.Value == Guid.Empty)
                {
                    tenantProperty.CurrentValue = activeTenant.Value;
                }
                // 2. REGRA ESTREITA DE SEGURANÇA: Se informado com ID diferente da sessão, barra imediatamente
                else if (currentValue.Value != activeTenant.Value)
                {
                    throw new UnauthorizedAccessException(
                        $"Violação de segurança multi-tenant. Tentativa de gravar registro para o restaurante '{currentValue.Value}' sob a sessão autenticada do restaurante '{activeTenant.Value}'.");
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}

public static class PersistenceServiceCollectionExtensions
{
    public static IServiceCollection AddPersistenceInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<ICurrentTenantProvider, CurrentTenantProvider>();

        // DbContext Pooling para otimizar alocação de memória e desempenho do GC
        services.AddDbContextPool<AppDbContext>((serviceProvider, options) =>
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
            });

            // Consultas não rastreadas por padrão para alta performance
            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        return services;
    }
}
