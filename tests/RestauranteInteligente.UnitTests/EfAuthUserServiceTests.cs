using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Persistence;
using RestauranteInteligente.Infrastructure.Security;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class EfAuthUserServiceTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    private AppDbContext CreateDbContext(bool hasTenant = false, Guid? tenantId = null)
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(hasTenant);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(tenantId ?? Guid.Empty);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options, _tenantContextMock.Object);
    }

    [Fact]
    public async Task FindByEmailAsync_ComEmailExistenteEAtivo_DeveRetornarUserAccountMapeado()
    {
        // Arrange
        using var dbContext = CreateDbContext();
        var usuario = new Usuario(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            nome: "Admin Teste",
            email: "admin@restaurante.com",
            senhaHash: "hash_seguro_123",
            role: "Admin",
            ativo: true
        );
        dbContext.Usuarios.Add(usuario);
        await dbContext.SaveChangesAsync();

        var service = new EfAuthUserService(dbContext);

        // Act
        var result = await service.FindByEmailAsync("admin@restaurante.com");

        // Assert
        result.Should().NotBeNull();
        result!.UserId.Should().Be(usuario.Id);
        result.RestauranteId.Should().Be(_tenantId);
        result.Email.Should().Be("admin@restaurante.com");
        result.PasswordHash.Should().Be("hash_seguro_123");
        result.Role.Should().Be("Admin");
    }

    [Fact]
    public async Task FindByEmailAsync_ComEmailInativo_DeveRetornarNull()
    {
        // Arrange
        using var dbContext = CreateDbContext();
        var usuario = new Usuario(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            nome: "Usuário Inativo",
            email: "inativo@restaurante.com",
            senhaHash: "hash_inativo_123",
            role: "Operador",
            ativo: false
        );
        dbContext.Usuarios.Add(usuario);
        await dbContext.SaveChangesAsync();

        var service = new EfAuthUserService(dbContext);

        // Act
        var result = await service.FindByEmailAsync("inativo@restaurante.com");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task FindByEmailAsync_ComEmailInexistente_DeveRetornarNull()
    {
        // Arrange
        using var dbContext = CreateDbContext();
        var service = new EfAuthUserService(dbContext);

        // Act
        var result = await service.FindByEmailAsync("inexistente@dominio.com");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task FindByEmailAsync_ComEmailComEspacosOuMaiusculas_DeveLocalizarCaseInsensitiveENormalizado()
    {
        // Arrange
        using var dbContext = CreateDbContext();
        var usuario = new Usuario(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            nome: "Gerente Caixa",
            email: "gerente@restaurante.com",
            senhaHash: "hash_gerente_abc",
            role: "Manager",
            ativo: true
        );
        dbContext.Usuarios.Add(usuario);
        await dbContext.SaveChangesAsync();

        var service = new EfAuthUserService(dbContext);

        // Act
        var result = await service.FindByEmailAsync("  GERENTE@restaurante.com  ");

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("gerente@restaurante.com");
        result.UserId.Should().Be(usuario.Id);
    }

    [Fact]
    public async Task FindByEmailAsync_MesmoComTenantContextAtivoDivergente_DeveLocalizarDevidoAoIgnoreQueryFilters()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        var usuario = new Usuario(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            nome: "Super Admin",
            email: "super@restaurante.com",
            senhaHash: "hash_cross_tenant",
            role: "Admin",
            ativo: true
        );

        // 1. Semeadura em contexto neutro (sem tenant)
        var neutroTenantContext = new Mock<ITenantContext>();
        neutroTenantContext.Setup(t => t.HasTenant).Returns(false);
        using (var seedContext = new AppDbContext(options, neutroTenantContext.Object))
        {
            seedContext.Usuarios.Add(usuario);
            await seedContext.SaveChangesAsync();
        }

        // 2. Consulta através de contexto com tenant totalmente divergente
        var outroTenant = Guid.Parse("11111111-2222-3333-4444-555555555555");
        var outroTenantContext = new Mock<ITenantContext>();
        outroTenantContext.Setup(t => t.HasTenant).Returns(true);
        outroTenantContext.Setup(t => t.RestauranteId).Returns(outroTenant);

        using var queryContext = new AppDbContext(options, outroTenantContext.Object);
        var service = new EfAuthUserService(queryContext);

        // Act
        var result = await service.FindByEmailAsync("super@restaurante.com");

        // Assert: Deve localizar o usuário ignorando o filtro global de tenant
        result.Should().NotBeNull();
        result!.RestauranteId.Should().Be(_tenantId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task FindByEmailAsync_ComEmailInvalidoOuVazio_DeveRetornarNull(string? emailInvalido)
    {
        // Arrange
        using var dbContext = CreateDbContext();
        var service = new EfAuthUserService(dbContext);

        // Act
        var result = await service.FindByEmailAsync(emailInvalido!);

        // Assert
        result.Should().BeNull();
    }
}
