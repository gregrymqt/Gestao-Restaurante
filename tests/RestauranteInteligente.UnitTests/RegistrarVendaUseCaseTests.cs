using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Vendas.DTOs;
using RestauranteInteligente.Application.Vendas.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RegistrarVendaUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IInsumoRepository> _insumoRepoMock = new();
    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<IDbContextTransaction> _transactionMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    public RegistrarVendaUseCaseTests()
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
    public async Task ExecutarAsync_SemCaixaAberto_DeveLancarInvalidOperationException()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);

        var useCase = new RegistrarVendaUseCase(
            _dbContextMock.Object,
            _insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        var input = new RegistrarVendaInputDto(
            FormaPagamento: "PIX",
            Itens: new List<ItemVendaInputDto> { new(Guid.NewGuid(), 1m) }
        );

        // Act
        Func<Task> act = async () => await useCase.ExecutarAsync(input);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Não há sessão de caixa aberta*");
    }

    [Fact]
    public async Task ExecutarAsync_ComProdutoInexistente_DeveLancarInvalidOperationException()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        inMemDb.FechamentosCaixa.Add(caixa);
        await inMemDb.SaveChangesAsync();

        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);
        _dbContextMock.Setup(d => d.Produtos).Returns(inMemDb.Produtos);

        var useCase = new RegistrarVendaUseCase(
            _dbContextMock.Object,
            _insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        var input = new RegistrarVendaInputDto(
            FormaPagamento: "CARTAO",
            Itens: new List<ItemVendaInputDto> { new(Guid.NewGuid(), 1m) }
        );

        // Act
        Func<Task> act = async () => await useCase.ExecutarAsync(input);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*não foram localizados no catálogo*");
    }

    [Fact]
    public async Task ExecutarAsync_ComProdutoInativo_DeveLancarInvalidOperationException()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        inMemDb.FechamentosCaixa.Add(caixa);

        var produtoInativo = new Produto(Guid.NewGuid(), _tenantId, "Lanche Descontinuado", null, 25m);
        produtoInativo.Desativar();
        inMemDb.Produtos.Add(produtoInativo);
        await inMemDb.SaveChangesAsync();

        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);
        _dbContextMock.Setup(d => d.Produtos).Returns(inMemDb.Produtos);

        var useCase = new RegistrarVendaUseCase(
            _dbContextMock.Object,
            _insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        var input = new RegistrarVendaInputDto(
            FormaPagamento: "DINHEIRO",
            Itens: new List<ItemVendaInputDto> { new(produtoInativo.Id, 1m) }
        );

        // Act
        Func<Task> act = async () => await useCase.ExecutarAsync(input);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*está inativo e não pode ser comercializado*");
    }

    [Fact]
    public async Task ExecutarAsync_ComEstoqueInsuficiente_DeveDispararRollbackELancarExcecao()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        inMemDb.FechamentosCaixa.Add(caixa);

        var insumoId = Guid.NewGuid();
        var insumo = new Insumo(insumoId, _tenantId, "Carne", "KG", 5m, 30m);
        insumo.CreditarEstoque(2m); // Saldo disponível: 2.0 KG

        var produto = new Produto(Guid.NewGuid(), _tenantId, "Hambúrguer", null, 35m);
        produto.AdicionarInsumo(insumoId, 1.5m); // Demanda por item: 1.5 KG
        inMemDb.Produtos.Add(produto);
        await inMemDb.SaveChangesAsync();

        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);
        _dbContextMock.Setup(d => d.Produtos).Returns(inMemDb.Produtos);

        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumo });

        var useCase = new RegistrarVendaUseCase(
            _dbContextMock.Object,
            _insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        var input = new RegistrarVendaInputDto(
            FormaPagamento: "PIX",
            Itens: new List<ItemVendaInputDto> { new(produto.Id, 2m) } // Demanda total: 2 * 1.5 = 3.0 KG (Maior que 2.0 KG)
        );

        // Act
        Func<Task> act = async () => await useCase.ExecutarAsync(input);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Saldo insuficiente para o insumo 'Carne'*");

        _transactionMock.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecutarAsync_ComSucesso_DeveExplodirBOM_DebitarEstoque_GravarLedger_CriarVenda_E_AtualizarCaixa()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        inMemDb.FechamentosCaixa.Add(caixa);

        var insumoId = Guid.NewGuid();
        var insumo = new Insumo(insumoId, _tenantId, "Pão de Hambúrguer", "UN", 10m, 2m);
        insumo.CreditarEstoque(50m);

        var produto = new Produto(Guid.NewGuid(), _tenantId, "X-Burger", null, 28.50m);
        produto.AdicionarInsumo(insumoId, 1m);
        inMemDb.Produtos.Add(produto);
        await inMemDb.SaveChangesAsync();

        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);
        _dbContextMock.Setup(d => d.Produtos).Returns(inMemDb.Produtos);
        _dbContextMock.Setup(d => d.Vendas).Returns(inMemDb.Vendas);
        _dbContextMock.Setup(d => d.MovimentacoesEstoque).Returns(inMemDb.MovimentacoesEstoque);
        _dbContextMock.Setup(d => d.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) => inMemDb.SaveChangesAsync(ct));

        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumo });

        var useCase = new RegistrarVendaUseCase(
            _dbContextMock.Object,
            _insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        var input = new RegistrarVendaInputDto(
            FormaPagamento: "CARTAO",
            Itens: new List<ItemVendaInputDto> { new(produto.Id, 3m) } // 3 * 28.50 = 85.50, consumo = 3 UN
        );

        // Act
        var result = await useCase.ExecutarAsync(input);

        // Assert
        result.Should().NotBeNull();
        result.ValorTotal.Should().Be(85.50m);
        result.FormaPagamento.Should().Be("CARTAO");
        result.Status.Should().Be("CONCLUIDA");
        result.Itens.Should().HaveCount(1);
        result.Itens[0].PrecoUnitario.Should().Be(28.50m);
        result.Itens[0].Subtotal.Should().Be(85.50m);

        // Valida débito do insumo
        insumo.QuantidadeEstoque.Should().Be(47m); // 50 - 3 = 47

        // Valida atualização dos acumuladores do caixa
        caixa.TotalVendas.Should().Be(85.50m);
        caixa.QuantidadeVendas.Should().Be(1);

        // Valida commit da transação
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);

        // Valida lançamento no ledger imutável
        var movimentacoes = await inMemDb.MovimentacoesEstoque.ToListAsync();
        movimentacoes.Should().HaveCount(1);
        movimentacoes[0].Tipo.Should().Be(TipoMovimentacao.Saida);
        movimentacoes[0].Origem.Should().Be(OrigemMovimentacao.Venda);
        movimentacoes[0].Quantidade.Should().Be(3m);
        movimentacoes[0].ReferenciaId.Should().Be(result.VendaId);
    }

    [Fact]
    public async Task ExecutarAsync_ComMultiplosProdutosQueCompartilhamInsumo_DeveAgruparConsumoE_SolicitarBloqueioOrdenadoPorInsumoIdAsc()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        inMemDb.FechamentosCaixa.Add(caixa);

        // IDs deliberadamente desordenados
        var idInsumoZ = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        var idInsumoA = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var insumoZ = new Insumo(idInsumoZ, _tenantId, "Molho Especial", "L", 5m, 10m);
        insumoZ.CreditarEstoque(10m);

        var insumoA = new Insumo(idInsumoA, _tenantId, "Carne Moída", "KG", 10m, 30m);
        insumoA.CreditarEstoque(20m);

        var prod1 = new Produto(Guid.NewGuid(), _tenantId, "Burger Simples", null, 20m);
        prod1.AdicionarInsumo(idInsumoZ, 0.05m); // 50ml molho
        prod1.AdicionarInsumo(idInsumoA, 0.15m); // 150g carne

        var prod2 = new Produto(Guid.NewGuid(), _tenantId, "Burger Duplo", null, 35m);
        prod2.AdicionarInsumo(idInsumoA, 0.30m); // 300g carne

        inMemDb.Produtos.AddRange(prod1, prod2);
        await inMemDb.SaveChangesAsync();

        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);
        _dbContextMock.Setup(d => d.Produtos).Returns(inMemDb.Produtos);
        _dbContextMock.Setup(d => d.Vendas).Returns(inMemDb.Vendas);
        _dbContextMock.Setup(d => d.MovimentacoesEstoque).Returns(inMemDb.MovimentacoesEstoque);
        _dbContextMock.Setup(d => d.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) => inMemDb.SaveChangesAsync(ct));

        IReadOnlyList<Guid>? capturedIds = null;
        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .Callback<IReadOnlyList<Guid>, CancellationToken>((ids, _) => capturedIds = ids)
            .ReturnsAsync(new List<Insumo> { insumoA, insumoZ });

        var useCase = new RegistrarVendaUseCase(
            _dbContextMock.Object,
            _insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        var input = new RegistrarVendaInputDto(
            FormaPagamento: "PIX",
            Itens: new List<ItemVendaInputDto>
            {
                new(prod1.Id, 2m), // Consome 0.10L molho e 0.30kg carne
                new(prod2.Id, 1m)  // Consome 0.30kg carne -> Total carne = 0.60kg
            }
        );

        // Act
        var result = await useCase.ExecutarAsync(input);

        // Assert: Regra crítica anti-deadlock: InsumoA (1111...) deve vir ANTES de InsumoZ (ffff...)
        capturedIds.Should().NotBeNull();
        capturedIds!.Should().HaveCount(2);
        capturedIds[0].Should().Be(idInsumoA);
        capturedIds[1].Should().Be(idInsumoZ);

        // Valida débitos acumulados
        insumoA.QuantidadeEstoque.Should().Be(19.40m); // 20 - 0.60 = 19.40
        insumoZ.QuantidadeEstoque.Should().Be(9.90m);  // 10 - 0.10 = 9.90
    }
}
