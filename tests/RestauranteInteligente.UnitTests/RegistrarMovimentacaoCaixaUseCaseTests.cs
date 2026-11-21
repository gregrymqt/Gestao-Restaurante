using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Caixa.DTOs;
using RestauranteInteligente.Application.Caixa.UseCases;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RegistrarMovimentacaoCaixaUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IFechamentoCaixaRepository> _fechamentoCaixaRepoMock = new();
    private readonly Mock<IVendaRepository> _vendaRepoMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _usuarioId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    public RegistrarMovimentacaoCaixaUseCaseTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
    }

    private RegistrarMovimentacaoCaixaUseCase CreateSut()
    {
        return new RegistrarMovimentacaoCaixaUseCase(
            _unitOfWorkMock.Object,
            _fechamentoCaixaRepoMock.Object,
            _vendaRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarMovimentacaoCaixaUseCase>.Instance
        );
    }

    [Fact]
    public async Task ExecutarAsync_QuandoSuprimentoValido_DeveRegistrarComSucessoEAumentarSaldo()
    {
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, _usuarioId);
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        _vendaRepoMock.Setup(r => r.ObterVendasPorFechamentoCaixaIdAsync(caixa.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda>());

        _fechamentoCaixaRepoMock.Setup(r => r.ObterMovimentacoesPorCaixaIdAsync(caixa.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MovimentacaoCaixa>());

        var sut = CreateSut();
        var input = new RegistrarMovimentacaoInputDto("SUPRIMENTO", 100m, "Troco inicial");

        var resultado = await sut.ExecutarAsync(_usuarioId, input);

        resultado.Should().NotBeNull();
        resultado.Sucesso.Should().BeTrue();
        resultado.Tipo.Should().Be("SUPRIMENTO");
        resultado.Valor.Should().Be(100m);
        resultado.SaldoAtualDinheiro.Should().Be(100m);
        resultado.Protocolo.Should().StartWith("SUP-");

        _fechamentoCaixaRepoMock.Verify(r => r.AdicionarMovimentacaoAsync(It.IsAny<MovimentacaoCaixa>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_QuandoSangriaComSaldoInsuficiente_DeveLancarInvalidOperationException()
    {
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, _usuarioId);
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        // Saldo disponível = 0
        _vendaRepoMock.Setup(r => r.ObterVendasPorFechamentoCaixaIdAsync(caixa.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda>());
        _fechamentoCaixaRepoMock.Setup(r => r.ObterMovimentacoesPorCaixaIdAsync(caixa.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MovimentacaoCaixa>());

        var sut = CreateSut();
        var input = new RegistrarMovimentacaoInputDto("SANGRIA", 50m, "Retirada para o cofre");

        var act = () => sut.ExecutarAsync(_usuarioId, input);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Saldo em dinheiro insuficiente na gaveta para sangria*");
    }

    [Fact]
    public async Task ExecutarAsync_QuandoSangriaComSaldoSuficiente_DeveRegistrarComSucessoEDiminuirSaldo()
    {
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, _usuarioId);
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        // Suprimento anterior de R$ 200,00
        var suprimentoAnterior = new MovimentacaoCaixa(
            Guid.NewGuid(), _tenantId, caixa.Id, _usuarioId, "SUPRIMENTO", 200m, "Troco", DateTimeOffset.UtcNow);

        _vendaRepoMock.Setup(r => r.ObterVendasPorFechamentoCaixaIdAsync(caixa.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda>());
        _fechamentoCaixaRepoMock.Setup(r => r.ObterMovimentacoesPorCaixaIdAsync(caixa.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MovimentacaoCaixa> { suprimentoAnterior });

        var sut = CreateSut();
        var input = new RegistrarMovimentacaoInputDto("SANGRIA", 80m, "Pagamento fornecedor local");

        var resultado = await sut.ExecutarAsync(_usuarioId, input);

        resultado.Should().NotBeNull();
        resultado.Sucesso.Should().BeTrue();
        resultado.Tipo.Should().Be("SANGRIA");
        resultado.Valor.Should().Be(80m);
        resultado.SaldoAtualDinheiro.Should().Be(120m);
        resultado.Protocolo.Should().StartWith("SAN-");

        _fechamentoCaixaRepoMock.Verify(r => r.AdicionarMovimentacaoAsync(It.IsAny<MovimentacaoCaixa>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_QuandoCaixaNaoAberto_DeveLancarInvalidOperationException()
    {
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((FechamentoCaixa?)null);

        var sut = CreateSut();
        var input = new RegistrarMovimentacaoInputDto("SUPRIMENTO", 50m, "Troco");

        var act = () => sut.ExecutarAsync(_usuarioId, input);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Não há sessão de caixa operacional aberta*");
    }
}
