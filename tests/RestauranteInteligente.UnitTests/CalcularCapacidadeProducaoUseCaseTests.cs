using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.UseCases;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class CalcularCapacidadeProducaoUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Guid _tenantId = Guid.NewGuid();

    public CalcularCapacidadeProducaoUseCaseTests()
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
    public async Task ExecutarAsync_SemTenantAtivo_DeveLancarInvalidOperationException()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var tenantMock = new Mock<ITenantContext>();
        tenantMock.Setup(t => t.HasTenant).Returns(false);

        var useCase = new CalcularCapacidadeProducaoUseCase(
            inMemDb,
            tenantMock.Object,
            NullLogger<CalcularCapacidadeProducaoUseCase>.Instance
        );

        // Act
        Func<Task> act = async () => await useCase.ExecutarAsync();

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Contexto de restaurante (Tenant) não inicializado*");
    }

    [Fact]
    public async Task ExecutarAsync_ProdutoMultiplosIngredientes_DeveIdentificarGargaloLimitanteECapacidadeMaxima()
    {
        // Arrange: Pizza Especial com Farinha (200g) e Queijo (150g).
        // Farinha tem 1000g (dá para 5 pizzas). Queijo tem 300g (dá para 2 pizzas).
        // Gargalo limitante é o Queijo, e a capacidade máxima deve ser 2.
        using var inMemDb = CreateInMemoryDbContext();
        var dataAlvo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

        var farinha = new Insumo(Guid.NewGuid(), _tenantId, "Farinha Especial", "KG", 1.0m, 5.0m);
        farinha.CreditarEstoque(1.0000m); // 1.0 kg no estoque

        var queijo = new Insumo(Guid.NewGuid(), _tenantId, "Queijo Muçarela", "KG", 0.5m, 40.0m);
        queijo.CreditarEstoque(0.3000m); // 0.3 kg no estoque

        inMemDb.Insumos.AddRange(farinha, queijo);

        var pizza = new Produto(Guid.NewGuid(), _tenantId, "Pizza Especial", null, 60.0m);
        inMemDb.Produtos.Add(pizza);

        var fichaFarinha = new ProdutoInsumo(Guid.NewGuid(), _tenantId, pizza.Id, farinha.Id, 0.2000m); // 200g
        var fichaQueijo = new ProdutoInsumo(Guid.NewGuid(), _tenantId, pizza.Id, queijo.Id, 0.1500m); // 150g
        inMemDb.ProdutosInsumos.AddRange(fichaFarinha, fichaQueijo);

        // Previsão de demanda para o dia seguinte: 5 pizzas
        var previsao = new Previsao(
            Guid.NewGuid(),
            _tenantId,
            pizza.Id,
            dataAlvo,
            DateOnly.FromDateTime(DateTime.UtcNow),
            5.0m,
            "hgb-regressor-v1"
        );
        inMemDb.Previsoes.Add(previsao);

        await inMemDb.SaveChangesAsync();

        var useCase = new CalcularCapacidadeProducaoUseCase(
            inMemDb,
            _tenantContextMock.Object,
            NullLogger<CalcularCapacidadeProducaoUseCase>.Instance
        );

        // Act
        var relatorio = await useCase.ExecutarAsync(dataAlvo);

        // Assert
        relatorio.Should().NotBeNull();
        relatorio.DataReferencia.Should().Be(dataAlvo);
        relatorio.ItensCapacidade.Should().HaveCount(1);

        var item = relatorio.ItensCapacidade[0];
        item.ProdutoId.Should().Be(pizza.Id);
        item.NomeProduto.Should().Be("Pizza Especial");
        item.DemandaPrevista.Should().Be(5.0m);
        item.CapacidadeMaximaProducao.Should().Be(2.0m); // Limitado pelo queijo (0.3 / 0.15 = 2)
        item.InsumoGargaloNome.Should().Be("Queijo Muçarela");
        item.DemandaAtendivel.Should().Be(2.0m);
        item.RiscoRutura.Should().BeTrue();
        item.DeficitUnidades.Should().Be(3.0m); // 5 - 2 = 3

        // Validação da sugestão de reposição para suprir a demanda integral (5 pizzas):
        // Farinha necessária: 5 * 0.2 = 1.0 kg. Estoque: 1.0 kg. Comprar: 0 kg (não deve constar na reposição com déficit).
        // Queijo necessário: 5 * 0.15 = 0.75 kg. Estoque: 0.3 kg. Comprar: 0.45 kg.
        relatorio.SugestoesReposicao.Should().HaveCount(1);
        var sugestaoQueijo = relatorio.SugestoesReposicao[0];
        sugestaoQueijo.InsumoId.Should().Be(queijo.Id);
        sugestaoQueijo.NomeInsumo.Should().Be("Queijo Muçarela");
        sugestaoQueijo.StockAtual.Should().Be(0.3000m);
        sugestaoQueijo.StockNecessario.Should().Be(0.7500m);
        sugestaoQueijo.QuantidadeComprar.Should().Be(0.4500m);
    }

    [Fact]
    public async Task ExecutarAsync_MultiplosProdutosCompartilhandoInsumo_DeveCalcularReposicaoAgregada()
    {
        // Arrange:
        // Hambúrguer: precisa de 0.150kg de Carne
        // Pastel de Carne: precisa de 0.050kg de Carne
        // Estoque atual de Carne: 1.000kg
        // Previsão Hambúrguer: 10 unidades -> 1.500kg
        // Previsão Pastel: 20 unidades -> 1.000kg
        // Total de Carne necessária: 2.500kg. Comprar: 2.500 - 1.000 = 1.500kg.
        using var inMemDb = CreateInMemoryDbContext();
        var dataAlvo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

        var carne = new Insumo(Guid.NewGuid(), _tenantId, "Carne Moída", "KG", 2.0m, 30.0m);
        carne.CreditarEstoque(1.0000m);
        inMemDb.Insumos.Add(carne);

        var burger = new Produto(Guid.NewGuid(), _tenantId, "Hambúrguer", null, 30.0m);
        var pastel = new Produto(Guid.NewGuid(), _tenantId, "Pastel", null, 10.0m);
        inMemDb.Produtos.AddRange(burger, pastel);

        var fichaBurger = new ProdutoInsumo(Guid.NewGuid(), _tenantId, burger.Id, carne.Id, 0.1500m);
        var fichaPastel = new ProdutoInsumo(Guid.NewGuid(), _tenantId, pastel.Id, carne.Id, 0.0500m);
        inMemDb.ProdutosInsumos.AddRange(fichaBurger, fichaPastel);

        var prevBurger = new Previsao(Guid.NewGuid(), _tenantId, burger.Id, dataAlvo, DateOnly.FromDateTime(DateTime.UtcNow), 10m, "hgb-regressor-v1");
        var prevPastel = new Previsao(Guid.NewGuid(), _tenantId, pastel.Id, dataAlvo, DateOnly.FromDateTime(DateTime.UtcNow), 20m, "hgb-regressor-v1");
        inMemDb.Previsoes.AddRange(prevBurger, prevPastel);

        await inMemDb.SaveChangesAsync();

        var useCase = new CalcularCapacidadeProducaoUseCase(
            inMemDb,
            _tenantContextMock.Object,
            NullLogger<CalcularCapacidadeProducaoUseCase>.Instance
        );

        // Act
        var relatorio = await useCase.ExecutarAsync(dataAlvo);

        // Assert
        relatorio.ItensCapacidade.Should().HaveCount(2);

        // Capacidade individual isolada:
        // Burger: 1.0 / 0.15 = 6.66 -> 6 unidades. Demanda: 10 -> Rutura = True
        var itemBurger = relatorio.ItensCapacidade.First(i => i.ProdutoId == burger.Id);
        itemBurger.CapacidadeMaximaProducao.Should().Be(6.0m);
        itemBurger.RiscoRutura.Should().BeTrue();

        // Pastel: 1.0 / 0.05 = 20 unidades. Demanda: 20 -> Rutura = False
        var itemPastel = relatorio.ItensCapacidade.First(i => i.ProdutoId == pastel.Id);
        itemPastel.CapacidadeMaximaProducao.Should().Be(20.0m);
        itemPastel.RiscoRutura.Should().BeFalse();

        // Sugestão de reposição agregada:
        // Total necessário: 10 * 0.15 + 20 * 0.05 = 1.5 + 1.0 = 2.5kg.
        // Estoque: 1.0kg. Comprar: 1.5kg.
        relatorio.SugestoesReposicao.Should().HaveCount(1);
        var sugestao = relatorio.SugestoesReposicao[0];
        sugestao.InsumoId.Should().Be(carne.Id);
        sugestao.StockNecessario.Should().Be(2.5000m);
        sugestao.QuantidadeComprar.Should().Be(1.5000m);
    }
}
