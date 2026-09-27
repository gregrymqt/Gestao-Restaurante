using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Api.DTOs.Caixa;
using RestauranteInteligente.Application.Caixa.UseCases;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class FechamentosControllerTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IEventPublisher> _eventPublisherMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    public FechamentosControllerTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
    }

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options, _tenantContextMock.Object);
    }

    [Fact]
    public async Task FecharCaixa_SemCaixaAberto_DeveRetornarUnprocessableEntity()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var useCase = new FecharCaixaUseCase(dbContext, _tenantContextMock.Object, _eventPublisherMock.Object, NullLogger<FecharCaixaUseCase>.Instance);
        var controller = new FechamentosController(useCase);

        // Act
        var result = await controller.FecharCaixa(CancellationToken.None);

        // Assert
        var unprocessableResult = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
        unprocessableResult.StatusCode.Should().Be(422);
    }

    [Fact]
    public async Task FecharCaixa_ComCaixaAberto_DeveRetornarOk200ComCorrelationId()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        dbContext.FechamentosCaixa.Add(caixa);
        await dbContext.SaveChangesAsync();

        var useCase = new FecharCaixaUseCase(dbContext, _tenantContextMock.Object, _eventPublisherMock.Object, NullLogger<FecharCaixaUseCase>.Instance);
        var controller = new FechamentosController(useCase);

        // Act
        var result = await controller.FecharCaixa(CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        var response = okResult.Value.Should().BeOfType<FecharCaixaResponseDto>().Subject;
        response.Status.Should().Be("FECHADO");
        response.CorrelationId.Should().NotBeEmpty();
    }
}
