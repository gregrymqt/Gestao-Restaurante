using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Application.Previsoes.UseCases;
using RestauranteInteligente.Infrastructure.Persistence;
using RestauranteInteligente.Infrastructure.Persistence.Repositories;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class PrevisoesControllerTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Guid _tenantId = Guid.NewGuid();

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options, _tenantContextMock.Object);
    }

    [Fact]
    public async Task ObterCapacidadeProducao_ComTenantAtivo_DeveRetornar200OkComRelatorio()
    {
        // Arrange
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);

        using var inMemDb = CreateInMemoryDbContext();
        var prevRepo = new PrevisaoRepository(inMemDb);
        var prodRepo = new ProdutoRepository(inMemDb);
        var useCase = new CalcularCapacidadeProducaoUseCase(
            prevRepo,
            prodRepo,
            _tenantContextMock.Object,
            NullLogger<CalcularCapacidadeProducaoUseCase>.Instance
        );

        var controller = new PrevisoesController(useCase);
        var dataAlvo = new DateOnly(2026, 9, 29);

        // Act
        var response = await controller.ObterCapacidadeProducao(dataAlvo, CancellationToken.None);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var relatorio = okResult.Value as RelatorioCapacidadeProducaoDto;
        relatorio.Should().NotBeNull();
        relatorio!.DataReferencia.Should().Be(dataAlvo);
    }

    [Fact]
    public async Task ObterCapacidadeProducao_SemTenantAtivo_DeveRetornar422UnprocessableEntity()
    {
        // Arrange
        _tenantContextMock.Setup(t => t.HasTenant).Returns(false);

        using var inMemDb = CreateInMemoryDbContext();
        var prevRepo = new PrevisaoRepository(inMemDb);
        var prodRepo = new ProdutoRepository(inMemDb);
        var useCase = new CalcularCapacidadeProducaoUseCase(
            prevRepo,
            prodRepo,
            _tenantContextMock.Object,
            NullLogger<CalcularCapacidadeProducaoUseCase>.Instance
        );

        var controller = new PrevisoesController(useCase);

        // Act
        var response = await controller.ObterCapacidadeProducao(null, CancellationToken.None);

        // Assert
        var unprocessable = response as UnprocessableEntityObjectResult;
        unprocessable.Should().NotBeNull();
        unprocessable!.StatusCode.Should().Be(422);
    }
}
