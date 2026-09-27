using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Messaging.Consumers;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class PrevisaoDemandaConcluidaConsumerTests
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
    public async Task Consume_NovaPrevisao_DeveAtivarTenantContext_E_PersistirEntidadePrevisao()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var produtoId = Guid.NewGuid();
        var dataAlvo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var solicitacaoId = Guid.NewGuid();

        var consumer = new PrevisaoDemandaConcluidaConsumer(
            inMemDb,
            _tenantContextMock.Object,
            NullLogger<PrevisaoDemandaConcluidaConsumer>.Instance
        );

        var message = new PrevisaoDemandaConcluidaEvent(
            SolicitacaoId: solicitacaoId,
            RestauranteId: _tenantId,
            ProdutoId: produtoId,
            DataAlvo: dataAlvo,
            QuantidadePrevista: 42.50m,
            ModeloVersao: "hgb-regressor-v1"
        );

        var consumeContextMock = new Mock<ConsumeContext<PrevisaoDemandaConcluidaEvent>>();
        consumeContextMock.Setup(c => c.Message).Returns(message);
        consumeContextMock.Setup(c => c.CancellationToken).Returns(CancellationToken.None);

        // Act
        await consumer.Consume(consumeContextMock.Object);

        // Assert
        _tenantContextMock.Verify(t => t.SetTenantId(_tenantId), Times.Once);

        var previsaoSalva = await inMemDb.Previsoes
            .FirstOrDefaultAsync(p => p.RestauranteId == _tenantId && p.ProdutoId == produtoId && p.DataPrevisao == dataAlvo);

        previsaoSalva.Should().NotBeNull();
        previsaoSalva!.QuantidadePrevista.Should().Be(42.50m);
        previsaoSalva.ModeloVersao.Should().Be("hgb-regressor-v1");
        previsaoSalva.DataPrevisao.Should().Be(dataAlvo);
    }

    [Fact]
    public async Task Consume_PrevisaoExistente_DeveAtualizarQuantidade_E_ModeloVersao()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var produtoId = Guid.NewGuid();
        var dataAlvo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var solicitacaoId = Guid.NewGuid();

        var previsaoAntiga = new Previsao(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            produtoId: produtoId,
            dataPrevisao: dataAlvo,
            dataReferencia: DateOnly.FromDateTime(DateTime.UtcNow),
            quantidadePrevista: 20.00m,
            modeloVersao: "baseline-heuristic-v1"
        );
        inMemDb.Previsoes.Add(previsaoAntiga);
        await inMemDb.SaveChangesAsync();

        var consumer = new PrevisaoDemandaConcluidaConsumer(
            inMemDb,
            _tenantContextMock.Object,
            NullLogger<PrevisaoDemandaConcluidaConsumer>.Instance
        );

        var message = new PrevisaoDemandaConcluidaEvent(
            SolicitacaoId: solicitacaoId,
            RestauranteId: _tenantId,
            ProdutoId: produtoId,
            DataAlvo: dataAlvo,
            QuantidadePrevista: 65.75m,
            ModeloVersao: "hgb-regressor-v2"
        );

        var consumeContextMock = new Mock<ConsumeContext<PrevisaoDemandaConcluidaEvent>>();
        consumeContextMock.Setup(c => c.Message).Returns(message);
        consumeContextMock.Setup(c => c.CancellationToken).Returns(CancellationToken.None);

        // Act
        await consumer.Consume(consumeContextMock.Object);

        // Assert
        _tenantContextMock.Verify(t => t.SetTenantId(_tenantId), Times.Once);

        var previsoes = await inMemDb.Previsoes
            .Where(p => p.RestauranteId == _tenantId && p.ProdutoId == produtoId && p.DataPrevisao == dataAlvo)
            .ToListAsync();

        previsoes.Should().HaveCount(1);
        previsoes[0].Id.Should().Be(previsaoAntiga.Id);
        previsoes[0].QuantidadePrevista.Should().Be(65.75m);
        previsoes[0].ModeloVersao.Should().Be("hgb-regressor-v2");
    }
}
