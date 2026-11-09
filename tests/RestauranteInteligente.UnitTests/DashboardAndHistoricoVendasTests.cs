using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Dashboard.UseCases;
using RestauranteInteligente.Application.Vendas.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class DashboardAndHistoricoVendasTests
{
    private readonly Guid _tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IVendaRepository> _vendaRepoMock = new();
    private readonly Mock<IFechamentoCaixaRepository> _fechamentoRepoMock = new();
    private readonly Mock<IInsumoRepository> _insumoRepoMock = new();
    private readonly Mock<IPrevisaoRepository> _previsaoRepoMock = new();
    private readonly Mock<IDadosClimaticosRepository> _climaRepoMock = new();
    private readonly Mock<ILogger<ListarHistoricoVendasUseCase>> _loggerHistoricoMock = new();
    private readonly Mock<ILogger<ObterResumoDashboardUseCase>> _loggerDashboardMock = new();

    public DashboardAndHistoricoVendasTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
    }

    [Fact]
    public async Task ListarHistoricoVendas_ComTenantAtivo_DeveRetornarVendasMapeadas()
    {
        // Arrange
        var vendaId = Guid.NewGuid();
        var produtoId = Guid.NewGuid();
        var venda = new Venda(vendaId, _tenantId, "PIX", status: "CONCLUIDA");
        venda.AdicionarItem(produtoId, 2m, 35.00m);

        _vendaRepoMock
            .Setup(r => r.ObterUltimasVendasAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda> { venda });

        var sut = new ListarHistoricoVendasUseCase(_vendaRepoMock.Object, _tenantContextMock.Object, _loggerHistoricoMock.Object);

        // Act
        var resultado = await sut.ExecutarAsync();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(1);
        var dto = resultado[0];
        dto.VendaId.Should().Be(vendaId);
        dto.FormaPagamento.Should().Be("PIX");
        dto.ValorTotal.Should().Be(70.00m);
        dto.QuantidadeItens.Should().Be(1);
        dto.Itens[0].Subtotal.Should().Be(70.00m);
    }

    [Fact]
    public async Task ListarHistoricoVendas_SemTenant_DeveLancarInvalidOperationException()
    {
        // Arrange
        _tenantContextMock.Setup(t => t.HasTenant).Returns(false);
        var sut = new ListarHistoricoVendasUseCase(_vendaRepoMock.Object, _tenantContextMock.Object, _loggerHistoricoMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.ExecutarAsync());
    }

    [Fact]
    public async Task ObterResumoDashboard_ComCaixaAbertoEVendas_DeveCalcularKpisCorretamente()
    {
        // Arrange
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        caixa.RegistrarVenda(150.00m);
        caixa.RegistrarVenda(50.00m);

        _fechamentoRepoMock
            .Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        var venda1 = new Venda(Guid.NewGuid(), _tenantId, "PIX");
        venda1.AdicionarItem(Guid.NewGuid(), 1m, 150.00m);

        var venda2 = new Venda(Guid.NewGuid(), _tenantId, "CARTAO_CREDITO");
        venda2.AdicionarItem(Guid.NewGuid(), 1m, 50.00m);

        _vendaRepoMock
            .Setup(r => r.ObterVendasConcluidasPorPeriodoAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda> { venda1, venda2 });

        var insumoCritico = new Insumo(Guid.NewGuid(), _tenantId, "Blend Bovino", "KG", 10.0m, 35.0m);
        insumoCritico.CreditarEstoque(4.0m); // Abaixo do mínimo de 10

        _insumoRepoMock
            .Setup(r => r.ObterTodosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumoCritico });

        _previsaoRepoMock
            .Setup(r => r.ObterPorDataAlvoAsync(It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Previsao>());

        var sut = new ObterResumoDashboardUseCase(
            _vendaRepoMock.Object,
            _fechamentoRepoMock.Object,
            _insumoRepoMock.Object,
            _previsaoRepoMock.Object,
            _climaRepoMock.Object,
            _tenantContextMock.Object,
            _loggerDashboardMock.Object
        );

        // Act
        var resumo = await sut.ExecutarAsync();

        // Assert
        resumo.Should().NotBeNull();
        resumo.StatusLoja.Should().Be("ABERTA");
        resumo.Kpis.TotalFaturadoDia.Should().Be(200.00m);
        resumo.Kpis.QuantidadePedidos.Should().Be(2);
        resumo.Kpis.TicketMedio.Should().Be(100.00m);
        resumo.InsumosCriticos.Should().HaveCount(1);
        resumo.InsumosCriticos[0].Nome.Should().Be("Blend Bovino");
        resumo.Pagamentos.Should().HaveCount(2);
    }
}
