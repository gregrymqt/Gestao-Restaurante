using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Application.Common.Events;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Application.Previsoes.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class SolicitarPrevisaoDemandaTests
{
    private readonly Guid _tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<IVendaRepository> _vendaRepoMock = new();
    private readonly Mock<IDadosClimaticosRepository> _climaRepoMock = new();
    private readonly Mock<IProdutoRepository> _produtoRepoMock = new();
    private readonly Mock<IRestauranteRepository> _restauranteRepoMock = new();
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IEventPublisher> _eventPublisherMock = new();
    private readonly Mock<IWeatherClient> _weatherClientMock = new();
    private readonly Mock<ILogger<SolicitarPrevisaoDemandaUseCase>> _loggerMock = new();

    public SolicitarPrevisaoDemandaTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
    }

    [Fact]
    public async Task ExecutarAsync_SemTenant_DeveLancarInvalidOperationException()
    {
        // Arrange
        _tenantContextMock.Setup(t => t.HasTenant).Returns(false);

        var sut = new SolicitarPrevisaoDemandaUseCase(
            _uowMock.Object,
            _vendaRepoMock.Object,
            _climaRepoMock.Object,
            _produtoRepoMock.Object,
            _restauranteRepoMock.Object,
            _tenantContextMock.Object,
            _eventPublisherMock.Object,
            _weatherClientMock.Object,
            _loggerMock.Object);

        // Act
        var act = () => sut.ExecutarAsync();

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Contexto de restaurante (Tenant) não inicializado*");
    }

    [Fact]
    public async Task ExecutarAsync_ComProdutosAtivos_DevePublicarEventosERetornarSucesso()
    {
        // Arrange
        var prod1 = new Produto(Guid.NewGuid(), _tenantId, "Hamburguer Supremo", "Delicioso", 38.00m);
        var prod2 = new Produto(Guid.NewGuid(), _tenantId, "Refrigerante", "Lata", 7.50m);

        _produtoRepoMock.Setup(r => r.ObterTodosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto> { prod1, prod2 });

        _vendaRepoMock.Setup(r => r.ObterVendasConcluidasPorPeriodoAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda>());

        _weatherClientMock.Setup(w => w.ObterPrevisaoClimaAsync(It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WeatherData(26.5m, 55.0m, 1.2m));

        var sut = new SolicitarPrevisaoDemandaUseCase(
            _uowMock.Object,
            _vendaRepoMock.Object,
            _climaRepoMock.Object,
            _produtoRepoMock.Object,
            _restauranteRepoMock.Object,
            _tenantContextMock.Object,
            _eventPublisherMock.Object,
            _weatherClientMock.Object,
            _loggerMock.Object);

        // Act
        var resultado = await sut.ExecutarAsync();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Status.Should().Be("SOLICITADA");
        resultado.TotalProdutosSolicitados.Should().Be(2);
        resultado.TemperaturaPrevista.Should().Be(26.5m);
        resultado.PrecipitacaoPrevista.Should().Be(1.2m);

        // Eventos publicados: 2 granulares por produto + 1 consolidado v1
        _eventPublisherMock.Verify(p => p.PublishAsync(It.IsAny<PrevisaoDemandaSolicitadaEvent>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _eventPublisherMock.Verify(p => p.PublishAsync(It.IsAny<PrevisaoDemandaSolicitadaEvent_v1>(), It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Controller_DispararPrevisao_DeveRetornarOk()
    {
        // Arrange
        var mockUseCase = new Mock<SolicitarPrevisaoDemandaUseCase>(
            _uowMock.Object,
            _vendaRepoMock.Object,
            _climaRepoMock.Object,
            _produtoRepoMock.Object,
            _restauranteRepoMock.Object,
            _tenantContextMock.Object,
            _eventPublisherMock.Object,
            _weatherClientMock.Object,
            _loggerMock.Object);

        var outputDto = new SolicitarPrevisaoDemandaOutputDto(
            Guid.NewGuid(),
            _tenantId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            3,
            25m,
            0m,
            "SOLICITADA",
            "Eventos publicados");

        var controller = new PrevisoesController(null, mockUseCase.Object);

        mockUseCase.Setup(u => u.ExecutarAsync(It.IsAny<DateOnly?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(outputDto);

        // Act
        var result = await controller.DispararPrevisao(null, CancellationToken.None);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(outputDto);
    }
}
