using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Caixa.UseCases;
using RestauranteInteligente.Application.Common.Events;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class FecharCaixaUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IEventPublisher> _eventPublisherMock = new();
    private readonly Mock<IWeatherClient> _weatherClientMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IFechamentoCaixaRepository> _fechamentoCaixaRepoMock = new();
    private readonly Mock<IVendaRepository> _vendaRepoMock = new();
    private readonly Mock<IDadosClimaticosRepository> _dadosClimaticosRepoMock = new();
    private readonly Mock<IProdutoRepository> _produtoRepoMock = new();
    private readonly Mock<IRestauranteRepository> _restauranteRepoMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    public FecharCaixaUseCaseTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
        _weatherClientMock.Setup(w => w.ObterPrevisaoClimaAsync(
            It.IsAny<decimal>(),
            It.IsAny<decimal>(),
            It.IsAny<DateOnly>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WeatherData(26.5m, 55.0m, 0.0m));
    }

    private FecharCaixaUseCase CreateSut()
    {
        return new FecharCaixaUseCase(
            _unitOfWorkMock.Object,
            _fechamentoCaixaRepoMock.Object,
            _vendaRepoMock.Object,
            _dadosClimaticosRepoMock.Object,
            _produtoRepoMock.Object,
            _restauranteRepoMock.Object,
            _tenantContextMock.Object,
            _eventPublisherMock.Object,
            _weatherClientMock.Object,
            NullLogger<FecharCaixaUseCase>.Instance
        );
    }

    [Fact]
    public async Task ExecutarAsync_SemCaixaAberto_DeveLancarInvalidOperationException()
    {
        // Arrange
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((FechamentoCaixa?)null);

        var useCase = CreateSut();

        // Act
        Func<Task> act = async () => await useCase.ExecutarAsync();

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Nenhuma sessão de caixa aberta foi localizada*");
    }

    [Fact]
    public async Task ExecutarAsync_ComCaixaAberto_DeveEncerrarCaixa_E_PublicarPrevisaoDemandaSolicitadaEventComCorrelationId()
    {
        // Arrange
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        caixa.RegistrarVenda(120.00m);
        caixa.RegistrarVenda(80.50m);
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        var produto = new Produto(Guid.NewGuid(), _tenantId, "Pizza Especial", null, 55m);
        _produtoRepoMock.Setup(r => r.ObterTodosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto> { produto });

        var venda = new Venda(Guid.NewGuid(), _tenantId, "CARTAO", caixa.Id, DateTimeOffset.UtcNow);
        venda.AdicionarItem(produto.Id, 1m, 55m);
        _vendaRepoMock.Setup(r => r.ObterVendasConcluidasPorPeriodoAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda> { venda });

        _dadosClimaticosRepoMock.Setup(r => r.ObterPorDataAsync(It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((DadosClimaticos?)null);

        _restauranteRepoMock.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Restaurante?)null);

        PrevisaoDemandaSolicitadaEvent_v1? publishedEvent = null;
        _eventPublisherMock.Setup(p => p.PublishAsync(It.IsAny<PrevisaoDemandaSolicitadaEvent_v1>(), It.IsAny<CancellationToken>()))
            .Callback<PrevisaoDemandaSolicitadaEvent_v1, CancellationToken>((evt, _) => publishedEvent = evt)
            .Returns(Task.CompletedTask);

        var useCase = CreateSut();

        // Act
        var result = await useCase.ExecutarAsync();

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("FECHADO");
        result.ValorTotalVendas.Should().Be(200.50m);
        result.QuantidadeVendas.Should().Be(2);
        result.CorrelationId.Should().NotBeEmpty();

        caixa.Status.Should().Be("FECHADO");
        caixa.DataFechamento.Should().NotBeNull();

        // Valida que o evento foi publicado com o payload correto
        publishedEvent.Should().NotBeNull();
        publishedEvent!.CorrelationId.Should().Be(result.CorrelationId);
        publishedEvent.RestauranteId.Should().Be(_tenantId);
        publishedEvent.Produtos.Should().HaveCount(1);
        publishedEvent.Produtos[0].ProdutoId.Should().Be(produto.Id);
        publishedEvent.Clima.Temperatura.Should().Be(26.5m);
        publishedEvent.HistoricoVendas.Should().HaveCount(1);

        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecutarAsync_ComCaixaAberto_DevePublicarPrevisaoDemandaSolicitadaEventParaCadaProdutoAtivo()
    {
        // Arrange
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        var produto1 = new Produto(Guid.NewGuid(), _tenantId, "Hamburguer Artesanal", null, 35m);
        var produto2 = new Produto(Guid.NewGuid(), _tenantId, "Batata Frita", null, 15m);
        _produtoRepoMock.Setup(r => r.ObterTodosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto> { produto1, produto2 });

        var venda = new Venda(Guid.NewGuid(), _tenantId, "PIX", caixa.Id, DateTimeOffset.UtcNow);
        venda.AdicionarItem(produto1.Id, 2m, 35m);
        _vendaRepoMock.Setup(r => r.ObterVendasConcluidasPorPeriodoAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda> { venda });

        _dadosClimaticosRepoMock.Setup(r => r.ObterPorDataAsync(It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((DadosClimaticos?)null);

        _restauranteRepoMock.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Restaurante?)null);

        var eventosPublicados = new List<PrevisaoDemandaSolicitadaEvent>();
        _eventPublisherMock.Setup(p => p.PublishAsync(It.IsAny<PrevisaoDemandaSolicitadaEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PrevisaoDemandaSolicitadaEvent, CancellationToken>((evt, _) => eventosPublicados.Add(evt))
            .Returns(Task.CompletedTask);

        _weatherClientMock.Setup(w => w.ObterPrevisaoClimaAsync(It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WeatherData(28.0m, 50.0m, 2.5m));

        var useCase = CreateSut();

        // Act
        var result = await useCase.ExecutarAsync();

        // Assert
        result.Should().NotBeNull();
        eventosPublicados.Should().HaveCount(2);

        var evtProd1 = eventosPublicados.FirstOrDefault(e => e.ProdutoId == produto1.Id);
        evtProd1.Should().NotBeNull();
        evtProd1!.RestauranteId.Should().Be(_tenantId);
        evtProd1.HistoricoVendasRecentes.Should().HaveCount(14);
        evtProd1.TemperaturaPrevista.Should().Be(28.0m);
        evtProd1.PrecipitacaoPrevista.Should().Be(2.5m);

        var evtProd2 = eventosPublicados.FirstOrDefault(e => e.ProdutoId == produto2.Id);
        evtProd2.Should().NotBeNull();
        evtProd2!.RestauranteId.Should().Be(_tenantId);
        evtProd2.HistoricoVendasRecentes.Should().HaveCount(14);
    }

    [Fact]
    public async Task ExecutarAsync_ComSucesso_DeveConsultarWeatherClient_E_PersistirDadosClimaticosParaDataAlvo()
    {
        // Arrange
        var restaurante = new Restaurante(
            _tenantId,
            "Restaurante Sabor & Arte",
            "12.345.678/0001-90",
            "São Paulo",
            "SP",
            -23.5505m,
            -46.6333m
        );
        _restauranteRepoMock.Setup(r => r.ObterPorIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(restaurante);

        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        _produtoRepoMock.Setup(r => r.ObterTodosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto>());

        _vendaRepoMock.Setup(r => r.ObterVendasConcluidasPorPeriodoAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda>());

        DadosClimaticos? dadosClimaticosAdicionados = null;
        _dadosClimaticosRepoMock.Setup(r => r.ObterPorDataAsync(It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((DadosClimaticos?)null);
        _dadosClimaticosRepoMock.Setup(r => r.AdicionarAsync(It.IsAny<DadosClimaticos>(), It.IsAny<CancellationToken>()))
            .Callback<DadosClimaticos, CancellationToken>((d, _) => dadosClimaticosAdicionados = d)
            .Returns(Task.CompletedTask);

        _weatherClientMock.Setup(w => w.ObterPrevisaoClimaAsync(
            -23.5505m,
            -46.6333m,
            It.IsAny<DateOnly>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WeatherData(29.5m, 68.0m, 4.2m));

        var useCase = CreateSut();

        // Act
        var result = await useCase.ExecutarAsync();

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("FECHADO");

        dadosClimaticosAdicionados.Should().NotBeNull();
        dadosClimaticosAdicionados!.Temperatura.Should().Be(29.5m);
        dadosClimaticosAdicionados.Umidade.Should().Be(68.0m);
        dadosClimaticosAdicionados.Precipitacao.Should().Be(4.2m);
        dadosClimaticosAdicionados.TipoDado.Should().Be("PREVISAO");

        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecutarAsync_QuandoWeatherClientFalha_DeveAplicarDegradacaoGraciosa_E_ConcluirFechamento()
    {
        // Arrange
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        _restauranteRepoMock.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Restaurante?)null);

        _produtoRepoMock.Setup(r => r.ObterTodosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto>());

        _vendaRepoMock.Setup(r => r.ObterVendasConcluidasPorPeriodoAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda>());

        DadosClimaticos? dadosClimaticosAdicionados = null;
        _dadosClimaticosRepoMock.Setup(r => r.ObterPorDataAsync(It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((DadosClimaticos?)null);
        _dadosClimaticosRepoMock.Setup(r => r.AdicionarAsync(It.IsAny<DadosClimaticos>(), It.IsAny<CancellationToken>()))
            .Callback<DadosClimaticos, CancellationToken>((d, _) => dadosClimaticosAdicionados = d)
            .Returns(Task.CompletedTask);

        _weatherClientMock.Setup(w => w.ObterPrevisaoClimaAsync(
            It.IsAny<decimal>(),
            It.IsAny<decimal>(),
            It.IsAny<DateOnly>(),
            It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Serviço Open-Meteo indisponível temporariamente"));

        var useCase = CreateSut();

        // Act
        var result = await useCase.ExecutarAsync();

        // Assert: Fechamento conclui sem lançar exceção
        result.Should().NotBeNull();
        result.Status.Should().Be("FECHADO");

        // Clima persistido com valores de fallback gracioso padrão
        dadosClimaticosAdicionados.Should().NotBeNull();
        dadosClimaticosAdicionados!.Temperatura.Should().Be(25.0m);
        dadosClimaticosAdicionados.Umidade.Should().Be(60.0m);
        dadosClimaticosAdicionados.Precipitacao.Should().Be(0.0m);

        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }
}
