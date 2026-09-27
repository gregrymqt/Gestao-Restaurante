using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Api.DTOs.Vendas;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Vendas.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class VendasControllerTests
{
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IInsumoRepository> _insumoRepoMock = new();
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    private readonly Mock<IAppDbContext> _dbContextMock = new();
    private readonly Mock<IDbContextTransaction> _transactionMock = new();

    public VendasControllerTests()
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
    public async Task RegistrarVenda_ComPayloadSemItens_DeveRetornarBadRequest()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var useCase = new RegistrarVendaUseCase(dbContext, _insumoRepoMock.Object, _tenantContextMock.Object, NullLogger<RegistrarVendaUseCase>.Instance);
        var controller = new VendasController(useCase);

        var request = new RegistrarVendaRequestDto(
            FormaPagamento: "PIX",
            Itens: new List<ItemVendaRequestDto>()
        );

        // Act
        var result = await controller.RegistrarVenda(request, CancellationToken.None);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task RegistrarVenda_SemCaixaAberto_DeveRetornarUnprocessableEntity()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var useCase = new RegistrarVendaUseCase(dbContext, _insumoRepoMock.Object, _tenantContextMock.Object, NullLogger<RegistrarVendaUseCase>.Instance);
        var controller = new VendasController(useCase);

        var request = new RegistrarVendaRequestDto(
            FormaPagamento: "DINHEIRO",
            Itens: new List<ItemVendaRequestDto> { new(Guid.NewGuid(), 1m) }
        );

        // Act
        var result = await controller.RegistrarVenda(request, CancellationToken.None);

        // Assert
        var unprocessableResult = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
        unprocessableResult.StatusCode.Should().Be(422);
    }

    [Fact]
    public async Task RegistrarVenda_ComSucesso_DeveRetornarCreated201()
    {
        // Arrange
        using var inMemDb = CreateInMemoryDbContext();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        inMemDb.FechamentosCaixa.Add(caixa);

        var produto = new Produto(Guid.NewGuid(), _tenantId, "Suco Natural", null, 12m);
        inMemDb.Produtos.Add(produto);
        await inMemDb.SaveChangesAsync();

        _dbContextMock.Setup(d => d.FechamentosCaixa).Returns(inMemDb.FechamentosCaixa);
        _dbContextMock.Setup(d => d.Produtos).Returns(inMemDb.Produtos);
        _dbContextMock.Setup(d => d.Vendas).Returns(inMemDb.Vendas);
        _dbContextMock.Setup(d => d.MovimentacoesEstoque).Returns(inMemDb.MovimentacoesEstoque);
        _dbContextMock.Setup(d => d.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) => inMemDb.SaveChangesAsync(ct));

        var useCase = new RegistrarVendaUseCase(_dbContextMock.Object, _insumoRepoMock.Object, _tenantContextMock.Object, NullLogger<RegistrarVendaUseCase>.Instance);
        var controller = new VendasController(useCase);

        var request = new RegistrarVendaRequestDto(
            FormaPagamento: "CARTAO",
            Itens: new List<ItemVendaRequestDto> { new(produto.Id, 2m) }
        );

        // Act
        var result = await controller.RegistrarVenda(request, CancellationToken.None);

        // Assert
        var createdResult = result.Should().BeOfType<ObjectResult>().Subject;
        createdResult.StatusCode.Should().Be(201);
        var response = createdResult.Value.Should().BeOfType<VendaResponseDto>().Subject;
        response.ValorTotal.Should().Be(24m);
        response.FormaPagamento.Should().Be("CARTAO");
    }
}
