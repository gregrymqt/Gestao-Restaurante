using FluentAssertions;
using MassTransit;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Messaging.Consumers;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class PrevisaoDemandaConcluidaConsumerTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Guid _tenantId = Guid.NewGuid();

    [Fact]
    public async Task Consume_NovaPrevisao_DeveAtivarTenantContext_E_PersistirEntidadePrevisao()
    {
        // Arrange
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var previsaoRepoMock = new Mock<IPrevisaoRepository>();
        var produtoId = Guid.NewGuid();
        var dataAlvo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var solicitacaoId = Guid.NewGuid();

        Previsao? savedPrevisao = null;
        previsaoRepoMock.Setup(r => r.ObterPorProdutoEDataAsync(produtoId, dataAlvo, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Previsao?)null);
        previsaoRepoMock.Setup(r => r.AdicionarAsync(It.IsAny<Previsao>(), It.IsAny<CancellationToken>()))
            .Callback<Previsao, CancellationToken>((p, _) => savedPrevisao = p)
            .Returns(Task.CompletedTask);

        var consumer = new PrevisaoDemandaConcluidaConsumer(
            unitOfWorkMock.Object,
            previsaoRepoMock.Object,
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
        savedPrevisao.Should().NotBeNull();
        savedPrevisao!.QuantidadePrevista.Should().Be(42.50m);
        savedPrevisao.ModeloVersao.Should().Be("hgb-regressor-v1");
        savedPrevisao.DataPrevisao.Should().Be(dataAlvo);
        unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Consume_PrevisaoExistente_DeveAtualizarQuantidade_E_ModeloVersao()
    {
        // Arrange
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var previsaoRepoMock = new Mock<IPrevisaoRepository>();
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

        previsaoRepoMock.Setup(r => r.ObterPorProdutoEDataAsync(produtoId, dataAlvo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(previsaoAntiga);

        var consumer = new PrevisaoDemandaConcluidaConsumer(
            unitOfWorkMock.Object,
            previsaoRepoMock.Object,
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
        previsaoAntiga.QuantidadePrevista.Should().Be(65.75m);
        previsaoAntiga.ModeloVersao.Should().Be("hgb-regressor-v2");
        unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
