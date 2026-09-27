using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Caixa.UseCases;
using RestauranteInteligente.Application.Common.Events;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class FecharCaixaUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IEventPublisher> _eventPublisherMock = new();
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    public FecharCaixaUseCaseTests()
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
    public async Task ExecutarAsync_SemCaixaAberto_DeveLancarInvalidOperationException()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);

        var useCase = new FecharCaixaUseCase(
            _dbContextMock.Object,
            _tenantContextMock.Object,
            _eventPublisherMock.Object,
            NullLogger<FecharCaixaUseCase>.Instance
        );

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
        using var inMemDb = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        caixa.RegistrarVenda(120.00m);
        caixa.RegistrarVenda(80.50m);
        inMemDb.FechamentosCaixa.Add(caixa);

        var produto = new Produto(Guid.NewGuid(), _tenantId, "Pizza Especial", null, 55m);
        inMemDb.Produtos.Add(produto);

        var clima = new DadosClimaticos(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            data: DateOnly.FromDateTime(DateTime.UtcNow),
            temperatura: 26.5m,
            umidade: 55m,
            precipitacao: 0.0m
        );
        inMemDb.DadosClimaticos.Add(clima);

        var venda = new Venda(Guid.NewGuid(), _tenantId, "CARTAO", caixa.Id, DateTimeOffset.UtcNow);
        venda.AdicionarItem(produto.Id, 1m, 55m);
        inMemDb.Vendas.Add(venda);

        await inMemDb.SaveChangesAsync();

        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);
        _dbContextMock.Setup(d => d.Produtos).Returns(inMemDb.Produtos);
        _dbContextMock.Setup(d => d.DadosClimaticos).Returns(inMemDb.DadosClimaticos);
        _dbContextMock.Setup(d => d.Vendas).Returns(inMemDb.Vendas);
        _dbContextMock.Setup(d => d.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) => inMemDb.SaveChangesAsync(ct));

        PrevisaoDemandaSolicitadaEvent_v1? publishedEvent = null;
        _eventPublisherMock.Setup(p => p.PublishAsync(It.IsAny<PrevisaoDemandaSolicitadaEvent_v1>(), It.IsAny<CancellationToken>()))
            .Callback<PrevisaoDemandaSolicitadaEvent_v1, CancellationToken>((evt, _) => publishedEvent = evt)
            .Returns(Task.CompletedTask);

        var useCase = new FecharCaixaUseCase(
            _dbContextMock.Object,
            _tenantContextMock.Object,
            _eventPublisherMock.Object,
            NullLogger<FecharCaixaUseCase>.Instance
        );

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
    }

    [Fact]
    public async Task ExecutarAsync_ComCaixaAberto_DevePublicarPrevisaoDemandaSolicitadaEventParaCadaProdutoAtivo()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        inMemDb.FechamentosCaixa.Add(caixa);

        var produto1 = new Produto(Guid.NewGuid(), _tenantId, "Hamburguer Artesanal", null, 35m);
        var produto2 = new Produto(Guid.NewGuid(), _tenantId, "Batata Frita", null, 15m);
        inMemDb.Produtos.AddRange(produto1, produto2);

        var clima = new DadosClimaticos(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            data: DateOnly.FromDateTime(DateTime.UtcNow),
            temperatura: 28.0m,
            umidade: 50m,
            precipitacao: 2.5m
        );
        inMemDb.DadosClimaticos.Add(clima);

        var venda = new Venda(Guid.NewGuid(), _tenantId, "PIX", caixa.Id, DateTimeOffset.UtcNow);
        venda.AdicionarItem(produto1.Id, 2m, 35m);
        inMemDb.Vendas.Add(venda);

        await inMemDb.SaveChangesAsync();

        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);
        _dbContextMock.Setup(d => d.Produtos).Returns(inMemDb.Produtos);
        _dbContextMock.Setup(d => d.DadosClimaticos).Returns(inMemDb.DadosClimaticos);
        _dbContextMock.Setup(d => d.Vendas).Returns(inMemDb.Vendas);
        _dbContextMock.Setup(d => d.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) => inMemDb.SaveChangesAsync(ct));

        var eventosPublicados = new List<PrevisaoDemandaSolicitadaEvent>();
        _eventPublisherMock.Setup(p => p.PublishAsync(It.IsAny<PrevisaoDemandaSolicitadaEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PrevisaoDemandaSolicitadaEvent, CancellationToken>((evt, _) => eventosPublicados.Add(evt))
            .Returns(Task.CompletedTask);

        var useCase = new FecharCaixaUseCase(
            _dbContextMock.Object,
            _tenantContextMock.Object,
            _eventPublisherMock.Object,
            NullLogger<FecharCaixaUseCase>.Instance
        );

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
}
