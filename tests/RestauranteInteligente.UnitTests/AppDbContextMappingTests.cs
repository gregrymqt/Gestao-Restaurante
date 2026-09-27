using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class AppDbContextMappingTests
{
    private readonly Guid _tenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private readonly Guid _tenantB = Guid.Parse("bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee");

    private AppDbContext CreateDbContext(string dbName, bool hasTenant, Guid tenantId)
    {
        var tenantMock = new Mock<ITenantContext>();
        tenantMock.Setup(t => t.HasTenant).Returns(hasTenant);
        tenantMock.Setup(t => t.RestauranteId).Returns(tenantId);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new AppDbContext(options, tenantMock.Object);
    }

    [Fact]
    public async Task GlobalQueryFilter_DeveFiltrarNovasEntidadesPorTenantAtivo()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();

        // 1. Semear dados para dois inquilinos distintos em contexto neutro (sem tenant)
        using (var seedContext = CreateDbContext(dbName, hasTenant: false, Guid.Empty))
        {
            var userA = new Usuario(Guid.NewGuid(), _tenantA, "User A", "user.a@teste.com", "hashA", "Admin");
            var userB = new Usuario(Guid.NewGuid(), _tenantB, "User B", "user.b@teste.com", "hashB", "Admin");
            seedContext.Usuarios.AddRange(userA, userB);

            var vendaA = new Venda(Guid.NewGuid(), _tenantA, "PIX");
            var vendaB = new Venda(Guid.NewGuid(), _tenantB, "DINHEIRO");
            seedContext.Vendas.AddRange(vendaA, vendaB);

            var dadosA = new DadosClimaticos(Guid.NewGuid(), _tenantA, new DateOnly(2026, 9, 27), 24.5m, 60m, 0m);
            var dadosB = new DadosClimaticos(Guid.NewGuid(), _tenantB, new DateOnly(2026, 9, 27), 22.0m, 70m, 5.2m);
            seedContext.DadosClimaticos.AddRange(dadosA, dadosB);

            var previsaoA = new Previsao(Guid.NewGuid(), _tenantA, Guid.NewGuid(), new DateOnly(2026, 9, 28), new DateOnly(2026, 9, 27), 15m, "v1.0");
            var previsaoB = new Previsao(Guid.NewGuid(), _tenantB, Guid.NewGuid(), new DateOnly(2026, 9, 28), new DateOnly(2026, 9, 27), 25m, "v1.0");
            seedContext.Previsoes.AddRange(previsaoA, previsaoB);

            await seedContext.SaveChangesAsync();
        }

        // 2. Consultar como Tenant A
        using (var queryContext = CreateDbContext(dbName, hasTenant: true, _tenantA))
        {
            var usuarios = await queryContext.Usuarios.ToListAsync();
            var vendas = await queryContext.Vendas.ToListAsync();
            var dados = await queryContext.DadosClimaticos.ToListAsync();
            var previsoes = await queryContext.Previsoes.ToListAsync();

            // Assert: Somente registros pertencentes ao Tenant A devem ser retornados
            usuarios.Should().HaveCount(1);
            usuarios[0].RestauranteId.Should().Be(_tenantA);

            vendas.Should().HaveCount(1);
            vendas[0].RestauranteId.Should().Be(_tenantA);

            dados.Should().HaveCount(1);
            dados[0].RestauranteId.Should().Be(_tenantA);

            previsoes.Should().HaveCount(1);
            previsoes[0].RestauranteId.Should().Be(_tenantA);
        }
    }
}
