using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Application.Previsoes.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class AtualizarStatusOrdemCompraUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IOrdemCompraRepository> _ordemCompraRepoMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _usuarioId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    public AtualizarStatusOrdemCompraUseCaseTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
    }

    private AtualizarStatusOrdemCompraUseCase CreateSut()
    {
        return new AtualizarStatusOrdemCompraUseCase(
            _unitOfWorkMock.Object,
            _ordemCompraRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<AtualizarStatusOrdemCompraUseCase>.Instance
        );
    }

    [Fact]
    public async Task ExecutarAsync_QuandoAprovarOrdem_DeveAtualizarStatusEFornecedorComSucesso()
    {
        // Arrange
        var ordemId = Guid.NewGuid();
        var ordem = new OrdemCompra(ordemId, _tenantId, "OC-20261123-0010", _usuarioId);
        ordem.AdicionarItem(Guid.NewGuid(), 10m, 4.5m);

        _ordemCompraRepoMock.Setup(r => r.ObterParaAtualizacaoAsync(ordemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ordem);

        var input = new AtualizarStatusOrdemCompraInputDto(
            NovoStatus: OrdemCompra.StatusAprovada,
            Fornecedor: "Distribuidora Central",
            Observacao: "Previsão de entrega para amanhã cedo"
        );

        var sut = CreateSut();

        // Act
        var resultado = await sut.ExecutarAsync(ordemId, input);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Status.Should().Be(OrdemCompra.StatusAprovada);
        resultado.Fornecedor.Should().Be("Distribuidora Central");
        resultado.Observacao.Should().Be("Previsão de entrega para amanhã cedo");

        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_QuandoCancelarOrdem_DeveAtualizarStatusParaCancelada()
    {
        // Arrange
        var ordemId = Guid.NewGuid();
        var ordem = new OrdemCompra(ordemId, _tenantId, "OC-20261123-0011", _usuarioId);
        ordem.AdicionarItem(Guid.NewGuid(), 5m, 12m);

        _ordemCompraRepoMock.Setup(r => r.ObterParaAtualizacaoAsync(ordemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ordem);

        var input = new AtualizarStatusOrdemCompraInputDto(
            NovoStatus: OrdemCompra.StatusCancelada,
            Observacao: "Item foi encontrado no estoque de reserva"
        );

        var sut = CreateSut();

        // Act
        var resultado = await sut.ExecutarAsync(ordemId, input);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Status.Should().Be(OrdemCompra.StatusCancelada);
        resultado.Observacao.Should().Contain("Item foi encontrado no estoque de reserva");

        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_QuandoStatusInvalido_DeveLancarArgumentException()
    {
        // Arrange
        var ordemId = Guid.NewGuid();
        var ordem = new OrdemCompra(ordemId, _tenantId, "OC-20261123-0012", _usuarioId);

        _ordemCompraRepoMock.Setup(r => r.ObterParaAtualizacaoAsync(ordemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ordem);

        var input = new AtualizarStatusOrdemCompraInputDto(NovoStatus: "STATUS_INVALIDO");
        var sut = CreateSut();

        // Act & Assert
        var act = () => sut.ExecutarAsync(ordemId, input);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*não permitida via endpoint de atualização simples*");
    }
}
