using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Vendas.DTOs;
using RestauranteInteligente.Application.Vendas.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

/// <summary>
/// Teste de integração de fluxo do cenário E2E:
/// Caixa aberto -> Venda de múltiplos hambúrgueres com explosão de BOM -> Baixa de estoque -> Disparo automático de EstoqueCritico no SSE.
/// </summary>
public sealed class EstoqueCriticoIntegrationFlowTests
{
    private readonly Guid _tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ITransactionScope> _transactionMock = new();
    private readonly Mock<IInsumoRepository> _insumoRepoMock = new();
    private readonly Mock<IProdutoRepository> _produtoRepoMock = new();
    private readonly Mock<IVendaRepository> _vendaRepoMock = new();
    private readonly Mock<IFechamentoCaixaRepository> _fechamentoCaixaRepoMock = new();
    private readonly Mock<ISseEventStreamService> _streamServiceMock = new();

    public EstoqueCriticoIntegrationFlowTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);

        _unitOfWorkMock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(_transactionMock.Object);
    }

    [Fact]
    public async Task FluxoCompleto_VendaMultiplosBurgersComExplosaoBOM_DeveDispararAlertaEstoqueCriticoParaInsumosAbaixoDoMinimo()
    {
        // 1. Turno de Caixa Aberto
        var operadorId = Guid.NewGuid();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, operadorId);
        _fechamentoCaixaRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(caixa);

        // 2. Insumos da Ficha Técnica: Pão Brioche (10 un, min 5) e Carne Angus (10 un, min 5)
        var paoId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var carneId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        var insumoPao = new Insumo(paoId, _tenantId, "Pão Brioche Artesanal", "UN", 5m, 2.50m);
        insumoPao.CreditarEstoque(10m);

        var insumoCarne = new Insumo(carneId, _tenantId, "Hambúrguer de Carne Angus 180g", "UN", 5m, 8.00m);
        insumoCarne.CreditarEstoque(10m);

        // 3. Produto: Hambúrguer Supremo (Ficha técnica consome 1 Pão + 1 Carne)
        var produtoBurger = new Produto(Guid.NewGuid(), _tenantId, "Hambúrguer Supremo", null, 38.00m);
        produtoBurger.AdicionarInsumo(paoId, 1m);
        produtoBurger.AdicionarInsumo(carneId, 1m);

        _produtoRepoMock.Setup(r => r.ObterPorIdsComFichaTecnicaAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto> { produtoBurger });

        _insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumoPao, insumoCarne });

        var sut = new RegistrarVendaUseCase(
            _unitOfWorkMock.Object,
            _insumoRepoMock.Object,
            _produtoRepoMock.Object,
            _vendaRepoMock.Object,
            _fechamentoCaixaRepoMock.Object,
            _streamServiceMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        // 4. Venda de 6 hambúrgueres: Consome 6 Pães e 6 Carnes.
        // Saldos finais: 10 - 6 = 4 unidades (ambos cruzam o limiar mínimo de 5 unidades)
        var inputVenda = new RegistrarVendaInputDto(
            FormaPagamento: "CARTAO",
            Itens: new List<ItemVendaInputDto>
            {
                new(produtoBurger.Id, 6m)
            }
        );

        // Act
        var output = await sut.ExecutarAsync(inputVenda);

        // Assert
        output.Should().NotBeNull();
        output.ValorTotal.Should().Be(228.00m); // 6 x 38.00 = 228.00

        // Saldos debitados corretamente
        insumoPao.QuantidadeEstoque.Should().Be(4m);
        insumoCarne.QuantidadeEstoque.Should().Be(4m);

        // Transação atômica confirmada
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);

        // Notificações SSE de EstoqueCrítico disparadas para ambos os insumos
        _streamServiceMock.Verify(s => s.PublishAsync(
            _tenantId,
            "EstoqueCritico",
            It.Is<string>(payload => payload.Contains("Pão Brioche") && payload.Contains("\"saldoAtual\":4")),
            It.IsAny<Guid>(),
            It.IsAny<CancellationToken>()
        ), Times.Once);

        _streamServiceMock.Verify(s => s.PublishAsync(
            _tenantId,
            "EstoqueCritico",
            It.Is<string>(payload => payload.Contains("Carne Angus") && payload.Contains("\"saldoAtual\":4")),
            It.IsAny<Guid>(),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }
}
