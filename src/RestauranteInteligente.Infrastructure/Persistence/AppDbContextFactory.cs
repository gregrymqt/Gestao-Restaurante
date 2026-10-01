using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Infrastructure.Persistence;

/// <summary>
/// Fábrica em tempo de design para o EF Core CLI (dotnet ef migrations / database update).
/// Permite instanciar o AppDbContext isoladamente sem depender de dependências de runtime do WebHost.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

        var connectionString = Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING")
            ?? "Host=127.0.0.1;Port=5432;Database=restaurante_db;Username=postgres;Password=postgres_seguro_123";

        optionsBuilder.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
        });

        var dummyTenantContext = new DesignTimeTenantContext();
        return new AppDbContext(optionsBuilder.Options, dummyTenantContext, null);
    }

    private sealed class DesignTimeTenantContext : ITenantContext
    {
        public Guid RestauranteId => Guid.Empty;
        public bool HasTenant => false;
        public void SetTenantId(Guid restauranteId) { }
    }
}
