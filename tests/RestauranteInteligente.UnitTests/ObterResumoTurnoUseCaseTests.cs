using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Caixa.UseCases;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class ObterResumoTurnoUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IFechamentoCaixaRepository> _fechamentoCaixaRepoMock = new();
    private readonly Mock<IVendaRepository> _vendaRepoMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _usuarioId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    public ObterResumoTurnoUseCaseTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
    }

    private ObterResumoTurnoUseCase CreateSut()
    {
        return new ObterResumoTurnoUseCase(
            _fechamentoCaixaRepoMock.Object,
            _vendaRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<ObterResumoTurnoUseCase>.Instance
        );
    }

    [Fact]
    public async Task ExecutarAsync_QuandoCaixaAbertoComVendasEMovimentacoes_DeveCalcularMetricasCorretamente()
    {
        var dataAbertura = DateTimeOffset.UtcNow.AddHours(-2);
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, _usuarioId, dataAbertura);

        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        // Venda 1: PIX R$ 100
        var venda1 = new Venda(Guid.NewGuid(), _tenantId, "PIX", caixa.Id, DateTimeOffset.UtcNow);
        venda1.AdicionarItem(Guid.NewGuid(), 2, 50m);

        // Venda 2: DINHEIRO R$ 50
        var venda2 = new Venda(Guid.NewGuid(), _tenantId, "DINHEIRO", caixa.Id, DateTimeOffset.UtcNow);
        venda2.AdicionarItem(Guid.NewGuid(), 1, 50m);

        // Venda 3: CARTAO_CREDITO R$ 150
        var venda3 = new Venda(Guid.NewGuid(), _tenantId, "CARTAO_CREDITO", caixa.Id, DateTimeOffset.UtcNow);
        venda3.AdicionarItem(Guid.NewGuid(), 3, 50m);

        _vendaRepoMock.Setup(r => r.ObterVendasPorFechamentoCaixaIdAsync(caixa.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda> { venda1, venda2, venda3 });

        // Movimentações: Suprimento R$ 100, Sangria R$ 30
        var sup = new MovimentacaoCaixa(Guid.NewGuid(), _tenantId, caixa.Id, _usuarioId, "SUPRIMENTO", 100m, "Fundo");
        var san = new MovimentacaoCaixa(Guid.NewGuid(), _tenantId, caixa.Id, _usuarioId, "SANGRIA", 30m, "Retirada");

        _fechamentoCaixaRepoMock.Setup(r => r.ObterMovimentacoesPorCaixaIdAsync(caixa.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MovimentacaoCaixa> { sup, san });

        var sut = CreateSut();
        var resultado = await sut.ExecutarAsync();

        resultado.Should().NotBeNull();
        resultado.TotalVendas.Should().Be(3);
        resultado.VolumeTotal.Should().Be(300m);
        resultado.TicketMedio.Should().Be(100m);
        resultado.TenderBreakdown.Pix.Should().Be(100m);
        resultado.TenderBreakdown.Dinheiro.Should().Be(50m);
        resultado.TenderBreakdown.Cartao.Should().Be(150m);
        // Saldo em dinheiro: Vendas Dinheiro (50) + Suprimento (100) - Sangria (30) = 120
        resultado.SaldoDinheiroGaveta.Should().Be(120m);
        resultado.TurnoNumero.Should().NotBeNullOrWhiteSpace();
        resultado.InicioTurno.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ExecutarAsync_QuandoNenhumCaixaAberto_DeveLancarInvalidOperationException()
    {
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((FechamentoCaixa?)null);

        var sut = CreateSut();
        var act = () => sut.ExecutarAsync();

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Não há sessão de caixa operacional aberta*");
    }
}
