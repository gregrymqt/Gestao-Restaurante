using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Kds.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class KdsPedidosUseCasesTests
{
    private readonly Guid _tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Mock<IVendaRepository> _vendaRepoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ITransactionScope> _transactionMock = new();
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<ISseEventStreamService> _streamServiceMock = new();
    private readonly Mock<ILogger<ListarPedidosKdsUseCase>> _loggerListMock = new();
    private readonly Mock<ILogger<AtualizarStatusPedidoKdsUseCase>> _loggerUpdateMock = new();

    public KdsPedidosUseCasesTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
        _unitOfWorkMock.Setup(u => u.CommitAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _unitOfWorkMock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_transactionMock.Object);
    }

    [Fact]
    public void Venda_AtualizarStatusPreparo_DeveAvancarEstagiosEPreencherTimestamps()
    {
        var venda = new Venda(Guid.NewGuid(), _tenantId, "PIX");
        venda.StatusPreparo.Should().Be(StatusPreparoKds.Recebido);
        venda.PreparoIniciadoEm.Should().BeNull();

        venda.AtualizarStatusPreparo("EM_PREPARO");
        venda.StatusPreparo.Should().Be(StatusPreparoKds.EmPreparo);
        venda.PreparoIniciadoEm.Should().NotBeNull();

        venda.AtualizarStatusPreparo("PRONTO");
        venda.StatusPreparo.Should().Be(StatusPreparoKds.Pronto);
        venda.ProntoEm.Should().NotBeNull();

        venda.AtualizarStatusPreparo("ENTREGUE");
        venda.StatusPreparo.Should().Be(StatusPreparoKds.Entregue);
        venda.EntregueEm.Should().NotBeNull();
    }

    [Fact]
    public void Venda_AtualizarStatusPreparo_QuandoCanceladaOuInvalido_DeveLancarExcecao()
    {
        var vendaInvalida = new Venda(Guid.NewGuid(), _tenantId, "DINHEIRO");
        Assert.Throws<ArgumentException>(() => vendaInvalida.AtualizarStatusPreparo("VOANDO"));

        vendaInvalida.Cancelar("Teste");
        vendaInvalida.StatusPreparo.Should().Be(StatusPreparoKds.Cancelado);
        Assert.Throws<InvalidOperationException>(() => vendaInvalida.AtualizarStatusPreparo("EM_PREPARO"));
    }

    [Fact]
    public async Task ListarPedidosKds_ComModificadoresJson_DeveMapearTagsECodigoCurto()
    {
        var vendaId = Guid.Parse("abcd1234-1111-1111-1111-111111111111");
        var venda = new Venda(vendaId, _tenantId, "PIX");
        var modJson = """
        [
            {"Nome":"Ao Ponto","TipoAcao":"Culinario","PrecoAdicional":0},
            {"Nome":"Sem Cebola","TipoAcao":1,"PrecoAdicional":0},
            {"Nome":"+ Bacon","TipoAcao":"Adicional","PrecoAdicional":4.50}
        ]
        """;
        venda.AdicionarItem(Guid.NewGuid(), 1m, 42.50m, modJson);

        _vendaRepoMock
            .Setup(r => r.ObterPedidosAtivosKdsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Venda> { venda });

        var sut = new ListarPedidosKdsUseCase(_vendaRepoMock.Object, _tenantContextMock.Object, _loggerListMock.Object);

        var resultado = await sut.ExecutarAsync();

        resultado.Should().HaveCount(1);
        var dto = resultado[0];
        dto.CodigoCurto.Should().Be("#ABCD");
        dto.StatusPreparo.Should().Be(StatusPreparoKds.Recebido);
        dto.Itens.Should().HaveCount(1);
        dto.Itens[0].Modificadores.Should().HaveCount(3);
        dto.Itens[0].Modificadores[0].TipoAcao.Should().Be("Culinario");
        dto.Itens[0].Modificadores[1].TipoAcao.Should().Be("Remocao");
        dto.Itens[0].Modificadores[2].TipoAcao.Should().Be("Adicional");
    }

    [Fact]
    public async Task ListarPedidosKds_SemTenant_DeveLancarInvalidOperationException()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(false);
        var sut = new ListarPedidosKdsUseCase(_vendaRepoMock.Object, _tenantContextMock.Object, _loggerListMock.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.ExecutarAsync());
    }

    [Fact]
    public async Task AtualizarStatusPedidoKds_ComSucesso_DevePersistirEPublicarEventoSse()
    {
        var vendaId = Guid.NewGuid();
        var venda = new Venda(vendaId, _tenantId, "PIX");

        _vendaRepoMock
            .Setup(r => r.ObterPorIdParaAtualizacaoAsync(vendaId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(venda);

        var sut = new AtualizarStatusPedidoKdsUseCase(
            _vendaRepoMock.Object,
            _unitOfWorkMock.Object,
            _tenantContextMock.Object,
            _streamServiceMock.Object,
            _loggerUpdateMock.Object);

        var dto = await sut.ExecutarAsync(vendaId, "EM_PREPARO");

        dto.StatusPreparo.Should().Be("EM_PREPARO");
        dto.PreparoIniciadoEm.Should().NotBeNull();
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        _streamServiceMock.Verify(
            s => s.PublishAsync(
                _tenantId,
                "PedidoStatusAtualizado",
                It.Is<string>(p => p.Contains("EM_PREPARO")),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AtualizarStatusPedidoKds_PedidoInexistente_DeveLancarKeyNotFoundException()
    {
        var vendaId = Guid.NewGuid();
        _vendaRepoMock
            .Setup(r => r.ObterPorIdParaAtualizacaoAsync(vendaId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Venda?)null);

        var sut = new AtualizarStatusPedidoKdsUseCase(
            _vendaRepoMock.Object,
            _unitOfWorkMock.Object,
            _tenantContextMock.Object,
            _streamServiceMock.Object,
            _loggerUpdateMock.Object);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => sut.ExecutarAsync(vendaId, "PRONTO"));
    }
}
