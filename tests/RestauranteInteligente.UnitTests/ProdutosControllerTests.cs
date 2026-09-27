using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Api.DTOs.Produtos;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class ProdutosControllerTests
{
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Mock<IProdutoRepository> _produtoRepositoryMock;
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly ProdutosController _controller;

    public ProdutosControllerTests()
    {
        _produtoRepositoryMock = new Mock<IProdutoRepository>();
        _tenantContextMock = new Mock<ITenantContext>();

        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);

        _controller = new ProdutosController(
            _produtoRepositoryMock.Object,
            _tenantContextMock.Object,
            NullLogger<ProdutosController>.Instance
        );
    }

    [Fact]
    public async Task ObterPorId_QuandoProdutoPertenceAoMesmoTenant_DeveRetornar200Ok()
    {
        var produtoId = Guid.NewGuid();
        var produto = new Produto(produtoId, _tenantId, "Pizza Margherita", "Molho, mussarela, manjericão", 49.90m);

        _produtoRepositoryMock.Setup(r => r.ObterPorIdAsync(produtoId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(produto);

        var result = await _controller.ObterPorId(produtoId, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        var response = (ProdutoResponse)okResult.Value!;

        response.Id.Should().Be(produtoId);
        response.Nome.Should().Be("Pizza Margherita");
        response.Preco.Should().Be(49.90m);
    }

    [Fact]
    public async Task ObterPorId_QuandoProdutoNaoExisteOuPertenceAOutroTenant_DeveRetornar404NotFoundAntiIDOR()
    {
        var produtoIdAlheio = Guid.NewGuid();

        // O repositório com Global Query Filter retorna null para IDs de outros inquilinos
        _produtoRepositoryMock.Setup(r => r.ObterPorIdAsync(produtoIdAlheio, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Produto?)null);

        var result = await _controller.ObterPorId(produtoIdAlheio, CancellationToken.None);

        result.Should().BeOfType<NotFoundObjectResult>("o endpoint não pode vazar existência de dados de outro tenant (anti-IDOR)");
    }

    [Fact]
    public async Task ListarProdutos_DeveRetornarOkComListaDeProdutos()
    {
        var produtos = new List<Produto>
        {
            new(Guid.NewGuid(), _tenantId, "Hambúrguer Artesanal", "Pão brioche e carne 180g", 38.00m),
            new(Guid.NewGuid(), _tenantId, "Batata Rústica", "Porção 300g", 22.00m)
        };

        _produtoRepositoryMock.Setup(r => r.ListarTodosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(produtos);

        var result = await _controller.ListarProdutos(CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        var response = ((IEnumerable<ProdutoResponse>)okResult.Value!).ToList();

        response.Should().HaveCount(2);
        response.Select(p => p.Nome).Should().Contain(new[] { "Hambúrguer Artesanal", "Batata Rústica" });
    }

    [Fact]
    public async Task CriarProduto_ComDadosValidos_DeveRetornar201CreatedAtActionComTenantInjetado()
    {
        var request = new CriarProdutoRequest("Suco Natural de Laranja", "Copo 500ml", 12.00m);

        var result = await _controller.CriarProduto(request, CancellationToken.None);

        result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = (CreatedAtActionResult)result;
        var response = (ProdutoResponse)createdResult.Value!;

        response.Nome.Should().Be("Suco Natural de Laranja");
        response.Preco.Should().Be(12.00m);

        _produtoRepositoryMock.Verify(r => r.AdicionarAsync(
            It.Is<Produto>(p => p.RestauranteId == _tenantId && p.Nome == "Suco Natural de Laranja"),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }
}
