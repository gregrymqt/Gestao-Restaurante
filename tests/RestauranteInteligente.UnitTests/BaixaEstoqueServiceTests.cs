using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Estoque.Services;
using RestauranteInteligente.Application.UseCases.Estoque.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class BaixaEstoqueServiceTests
{
    private readonly Guid _tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IInsumoRepository> _insumoRepoMock = new();
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<IDbContextTransaction> _transactionMock = new();
    private readonly Mock<ILogger<BaixaEstoqueService>> _loggerMock = new();

    public BaixaEstoqueServiceTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);

        _dbContextMock.Setup(d => d.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(_transactionMock.Object);
    }

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options, _tenantContextMock.Object);
    }

    [Fact]
    public async Task ExecutarBaixaAsync_ComItensDesordenados_DeveSolicitarBloqueioOrdenadoPorInsumoIdAsc()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        _dbContextMock.Setup(d => d.MovimentacoesEstoque).Returns(inMemDb.MovimentacoesEstoque);
        _dbContextMock.Setup(d => d.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) => inMemDb.SaveChangesAsync(ct));

        var id1 = Guid.Parse("10000000-0000-0000-0000-000000000001");
        var id2 = Guid.Parse("20000000-0000-0000-0000-000000000002");
        var id3 = Guid.Parse("30000000-0000-0000-0000-000000000003");

        var insumo1 = new Insumo(id1, _tenantId, "Carne Bovina", "KG", 10m, 35m);
        insumo1.CreditarEstoque(50m);

        var insumo2 = new Insumo(id2, _tenantId, "Pão Brioche", "UN", 20m, 1.5m);
        insumo2.CreditarEstoque(100m);

        var insumo3 = new Insumo(id3, _tenantId, "Queijo Cheddar", "KG", 5m, 40m);
        insumo3.CreditarEstoque(20m);

        IReadOnlyList<Guid>? capturedIds = null;
        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .Callback<IReadOnlyList<Guid>, CancellationToken>((ids, _) => capturedIds = ids)
            .ReturnsAsync(new List<Insumo> { insumo1, insumo2, insumo3 });

        var sut = new BaixaEstoqueService(_dbContextMock.Object, _insumoRepoMock.Object, _tenantContextMock.Object, _loggerMock.Object);

        // Payload propositalmente enviado em ordem NÃO-ascendente: id3, id1, id2
        var payload = new List<ItemBaixaEstoqueDto>
        {
            new(id3, 2m),
            new(id1, 5m),
            new(id2, 10m)
        };

        // Act
        var result = await sut.ExecutarBaixaAsync(payload, OrigemMovimentacao.Venda, "Venda Pedido #123");

        // Assert
        result.Sucesso.Should().BeTrue();
        capturedIds.Should().NotBeNull();
        capturedIds.Should().ContainInOrder(new[] { id1, id2, id3 });
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarBaixaAsync_ComInsumosDuplicadosNoPayload_DeveAgruparVolumesCorretamente()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        _dbContextMock.Setup(d => d.MovimentacoesEstoque).Returns(inMemDb.MovimentacoesEstoque);
        _dbContextMock.Setup(d => d.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) => inMemDb.SaveChangesAsync(ct));

        var id = Guid.NewGuid();
        var insumo = new Insumo(id, _tenantId, "Tomate Molho", "KG", 2m, 8m);
        insumo.CreditarEstoque(10m);

        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumo });

        var sut = new BaixaEstoqueService(_dbContextMock.Object, _insumoRepoMock.Object, _tenantContextMock.Object, _loggerMock.Object);

        // Duplicados no payload (ex: 2 itens de venda usando o mesmo insumo)
        var payload = new List<ItemBaixaEstoqueDto>
        {
            new(id, 2.5m),
            new(id, 3.5m)
        };

        // Act
        var result = await sut.ExecutarBaixaAsync(payload, OrigemMovimentacao.Venda, "Venda #100");

        // Assert
        result.Sucesso.Should().BeTrue();
        insumo.QuantidadeEstoque.Should().Be(4.0m);
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarBaixaAsync_ComSaldoInsuficiente_DeveFazerRollbackERetornarFalha()
    {
        // Arrange
        var id = Guid.NewGuid();
        var insumo = new Insumo(id, _tenantId, "Trufa Negra", "G", 1m, 120m);
        insumo.CreditarEstoque(2m); // Saldo é 2, pede 5

        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumo });

        var sut = new BaixaEstoqueService(_dbContextMock.Object, _insumoRepoMock.Object, _tenantContextMock.Object, _loggerMock.Object);

        var payload = new List<ItemBaixaEstoqueDto> { new(id, 5m) };

        // Act
        var result = await sut.ExecutarBaixaAsync(payload, OrigemMovimentacao.Venda, "Venda Gourmet");

        // Assert
        result.Sucesso.Should().BeFalse();
        result.MensagemErro.Should().Contain("Saldo insuficiente");
        _transactionMock.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Never);
        insumo.QuantidadeEstoque.Should().Be(2m);
    }

    [Fact]
    public async Task ExecutarBaixaAsync_ComInsumoNaoEncontradoNoRestaurante_DeveRetornarFalha()
    {
        // Arrange
        var id = Guid.NewGuid();
        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo>()); // Não retorna nenhum insumo

        var sut = new BaixaEstoqueService(_dbContextMock.Object, _insumoRepoMock.Object, _tenantContextMock.Object, _loggerMock.Object);

        var payload = new List<ItemBaixaEstoqueDto> { new(id, 1m) };

        // Act
        var result = await sut.ExecutarBaixaAsync(payload, OrigemMovimentacao.Venda, "Venda Pedido #999");

        // Assert
        result.Sucesso.Should().BeFalse();
        result.MensagemErro.Should().Contain("não foram localizados");
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecutarBaixaAsync_SemTenantContext_DeveRetornarFalhaSemIniciarTransacao()
    {
        // Arrange
        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.HasTenant).Returns(false);

        var sut = new BaixaEstoqueService(_dbContextMock.Object, _insumoRepoMock.Object, tenantContextMock.Object, _loggerMock.Object);

        var payload = new List<ItemBaixaEstoqueDto> { new(Guid.NewGuid(), 1m) };

        // Act
        var result = await sut.ExecutarBaixaAsync(payload, OrigemMovimentacao.Venda, "Venda Sem Tenant");

        // Assert
        result.Sucesso.Should().BeFalse();
        result.MensagemErro.Should().Contain("Contexto de restaurante (Tenant) não inicializado");
        _dbContextMock.Verify(d => d.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecutarBaixaAsync_ComSucesso_DeveRegistrarLedgerImutavelEComitar()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        _dbContextMock.Setup(d => d.MovimentacoesEstoque).Returns(inMemDb.MovimentacoesEstoque);
        _dbContextMock.Setup(d => d.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) => inMemDb.SaveChangesAsync(ct));

        var id = Guid.NewGuid();
        var insumo = new Insumo(id, _tenantId, "Farinha Especial", "KG", 10m, 5.5m);
        insumo.CreditarEstoque(50m);

        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumo });

        var sut = new BaixaEstoqueService(_dbContextMock.Object, _insumoRepoMock.Object, _tenantContextMock.Object, _loggerMock.Object);

        var payload = new List<ItemBaixaEstoqueDto> { new(id, 12.5m) };

        // Act
        var result = await sut.ExecutarBaixaAsync(payload, OrigemMovimentacao.Venda, "Produção Diária");

        // Assert
        result.Sucesso.Should().BeTrue();
        insumo.QuantidadeEstoque.Should().Be(37.5m);

        var ledger = await inMemDb.MovimentacoesEstoque.ToListAsync();
        ledger.Should().HaveCount(1);
        var entry = ledger.First();
        entry.InsumoId.Should().Be(id);
        entry.RestauranteId.Should().Be(_tenantId);
        entry.Quantidade.Should().Be(12.5m);
        entry.Tipo.Should().Be(TipoMovimentacao.Saida);
        entry.Origem.Should().Be(OrigemMovimentacao.Venda);
        entry.CustoUnitarioMomento.Should().Be(5.5m);
        entry.Motivo.Should().Be("Produção Diária");

        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
