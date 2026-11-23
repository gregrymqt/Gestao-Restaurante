using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class ReceberOrdemCompraUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IOrdemCompraRepository> _ordemCompraRepoMock = new();
    private readonly Mock<IInsumoRepository> _insumoRepoMock = new();
    private readonly Mock<ITransactionScope> _txMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _usuarioId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    public ReceberOrdemCompraUseCaseTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
        _unitOfWorkMock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(_txMock.Object);
    }

    private ReceberOrdemCompraUseCase CreateSut()
    {
        return new ReceberOrdemCompraUseCase(
            _unitOfWorkMock.Object,
            _ordemCompraRepoMock.Object,
            _insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<ReceberOrdemCompraUseCase>.Instance
        );
    }

    [Fact]
    public async Task ExecutarAsync_QuandoOrdemValida_DeveCreditarEstoqueEGravarLedgerComSucesso()
    {
        // Arrange
        var ordemId = Guid.NewGuid();
        var insumoId1 = Guid.NewGuid();
        var insumoId2 = Guid.NewGuid();

        var ordem = new OrdemCompra(ordemId, _tenantId, "OC-20261123-0001", _usuarioId);
        ordem.AdicionarItem(insumoId1, 15m, 5.50m);
        ordem.AdicionarItem(insumoId2, 20m, 10.00m);
        ordem.Aprovar("Fornecedor Alimentos Ltda", "Entregue pela manhã");

        var insumo1 = new Insumo(insumoId1, _tenantId, "Farinha de Trigo", "KG", 5m, 5.50m);
        insumo1.CreditarEstoque(10m);
        var insumo2 = new Insumo(insumoId2, _tenantId, "Manteiga", "KG", 2m, 10.00m);
        insumo2.CreditarEstoque(5m);

        _ordemCompraRepoMock.Setup(r => r.ObterParaAtualizacaoAsync(ordemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ordem);

        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(
                It.Is<IReadOnlyList<Guid>>(ids => ids.SequenceEqual(new[] { insumoId1, insumoId2 }.OrderBy(i => i))),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumo1, insumo2 });

        var sut = CreateSut();

        // Act
        var resultado = await sut.ExecutarAsync(ordemId);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Status.Should().Be(OrdemCompra.StatusRecebida);
        resultado.TotalItensCreditados.Should().Be(2);

        // Saldos creditados
        insumo1.QuantidadeEstoque.Should().Be(25m); // 10 + 15
        insumo2.QuantidadeEstoque.Should().Be(25m); // 5 + 20

        // Movimentações no Ledger imutável
        _insumoRepoMock.Verify(r => r.AdicionarMovimentacaoAsync(
            It.Is<MovimentacaoEstoque>(m =>
                m.RestauranteId == _tenantId &&
                m.Tipo == TipoMovimentacao.Entrada &&
                m.Origem == OrigemMovimentacao.Compra),
            It.IsAny<CancellationToken>()), Times.Exactly(2));

        // Transação comitada
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        _txMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_QuandoOrdemJaRecebida_DeveLancarInvalidOperationException()
    {
        // Arrange
        var ordemId = Guid.NewGuid();
        var ordem = new OrdemCompra(ordemId, _tenantId, "OC-20261123-0002", _usuarioId);
        ordem.AdicionarItem(Guid.NewGuid(), 10m, 5m);
        ordem.MarcarRecebida();

        _ordemCompraRepoMock.Setup(r => r.ObterParaAtualizacaoAsync(ordemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ordem);

        var sut = CreateSut();

        // Act & Assert
        var act = () => sut.ExecutarAsync(ordemId);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*já foi recebida*");
    }

    [Fact]
    public async Task ExecutarAsync_QuandoOrdemCancelada_DeveLancarInvalidOperationException()
    {
        // Arrange
        var ordemId = Guid.NewGuid();
        var ordem = new OrdemCompra(ordemId, _tenantId, "OC-20261123-0003", _usuarioId);
        ordem.AdicionarItem(Guid.NewGuid(), 10m, 5m);
        ordem.Cancelar("Cancelada por erro");

        _ordemCompraRepoMock.Setup(r => r.ObterParaAtualizacaoAsync(ordemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ordem);

        var sut = CreateSut();

        // Act & Assert
        var act = () => sut.ExecutarAsync(ordemId);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*está cancelada*");
    }
}
