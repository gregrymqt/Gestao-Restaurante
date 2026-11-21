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

public sealed class RegistrarOrdemCompraUseCaseTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IOrdemCompraRepository> _ordemCompraRepoMock = new();
    private readonly Mock<IInsumoRepository> _insumoRepoMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _usuarioId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    public RegistrarOrdemCompraUseCaseTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
    }

    private RegistrarOrdemCompraUseCase CreateSut()
    {
        return new RegistrarOrdemCompraUseCase(
            _unitOfWorkMock.Object,
            _ordemCompraRepoMock.Object,
            _insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarOrdemCompraUseCase>.Instance
        );
    }

    [Fact]
    public async Task ExecutarAsync_QuandoDadosValidos_DevePersistirOrdemCompraComSucesso()
    {
        var insumoId1 = Guid.NewGuid();
        var insumoId2 = Guid.NewGuid();

        _insumoRepoMock.Setup(r => r.ObterPorIdAsync(insumoId1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Insumo(insumoId1, _tenantId, "Carne Moída", "KG", 10m, 30m));

        _insumoRepoMock.Setup(r => r.ObterPorIdAsync(insumoId2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Insumo(insumoId2, _tenantId, "Pão Brioche", "UN", 20m, 2m));

        var sut = CreateSut();
        var input = new CriarOrdemCompraInputDto(new List<ItemOrdemCompraInputDto>
        {
            new(insumoId1, 10m, 30m),
            new(insumoId2, 50m, 2m)
        });

        var resultado = await sut.ExecutarAsync(_usuarioId, input);

        resultado.Should().NotBeNull();
        resultado.Sucesso.Should().BeTrue();
        resultado.Status.Should().Be("PENDENTE");
        resultado.Protocolo.Should().StartWith("OC-");
        resultado.ValorTotal.Should().Be(400m); // 10*30 + 50*2 = 400

        _ordemCompraRepoMock.Verify(r => r.AdicionarAsync(It.Is<OrdemCompra>(o => o.Itens.Count == 2), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_QuandoListaItensVazia_DeveLancarArgumentException()
    {
        var sut = CreateSut();
        var input = new CriarOrdemCompraInputDto(new List<ItemOrdemCompraInputDto>());

        var act = () => sut.ExecutarAsync(_usuarioId, input);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*deve conter ao menos um item*");
    }
}
