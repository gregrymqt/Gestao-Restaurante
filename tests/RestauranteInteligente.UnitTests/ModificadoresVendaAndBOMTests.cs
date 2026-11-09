using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Produtos.UseCases;
using RestauranteInteligente.Application.Vendas.DTOs;
using RestauranteInteligente.Application.Vendas.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class ModificadoresVendaAndBOMTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ITransactionScope> _transactionMock = new();
    private readonly Mock<IInsumoRepository> _insumoRepoMock = new();
    private readonly Mock<IProdutoRepository> _produtoRepoMock = new();
    private readonly Mock<IVendaRepository> _vendaRepoMock = new();
    private readonly Mock<IFechamentoCaixaRepository> _caixaRepoMock = new();
    private readonly Mock<ISseEventStreamService> _streamServiceMock = new();
    private readonly Mock<IGrupoModificadorRepository> _grupoModificadorRepoMock = new();

    public ModificadoresVendaAndBOMTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);

        _unitOfWorkMock
            .Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(_transactionMock.Object);
    }

    private RegistrarVendaUseCase CreateSut()
    {
        return new RegistrarVendaUseCase(
            _unitOfWorkMock.Object,
            _insumoRepoMock.Object,
            _produtoRepoMock.Object,
            _vendaRepoMock.Object,
            _caixaRepoMock.Object,
            _streamServiceMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );
    }

    [Fact]
    public async Task ExecutarAsync_ComModificadoresCulinarios_NaoDeveAlterarPrecoNemDebitarInsumosAdicionais()
    {
        // Arrange
        var sut = CreateSut();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        _caixaRepoMock.Setup(c => c.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(caixa);

        var insumoPao = new Insumo(Guid.NewGuid(), _tenantId, "Pão Brioche", "UN", 10m, 2m);
        insumoPao.CreditarEstoque(50m);
        var produto = new Produto(Guid.NewGuid(), _tenantId, "Smash Burger", "Burger", 25.00m);
        produto.AdicionarInsumo(insumoPao.Id, 1m);

        _produtoRepoMock
            .Setup(p => p.ObterPorIdsComFichaTecnicaAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto> { produto });

        _insumoRepoMock
            .Setup(i => i.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumoPao });

        Venda? vendaPersistida = null;
        _vendaRepoMock
            .Setup(v => v.AdicionarAsync(It.IsAny<Venda>(), It.IsAny<CancellationToken>()))
            .Callback<Venda, CancellationToken>((v, _) => vendaPersistida = v)
            .Returns(Task.CompletedTask);

        var modCulinario = new ItemVendaModificadorInputDto(
            Guid.NewGuid(), "Ao Ponto", 0m, null, 0m, TipoAcaoModificador.Culinario
        );
        var modRemocao = new ItemVendaModificadorInputDto(
            Guid.NewGuid(), "Sem Cebola", 0m, null, 0m, TipoAcaoModificador.Remocao
        );

        var input = new RegistrarVendaInputDto(
            "PIX",
            new List<ItemVendaInputDto>
            {
                new(produto.Id, 2m, new List<ItemVendaModificadorInputDto> { modCulinario, modRemocao })
            }
        );

        // Act
        var output = await sut.ExecutarAsync(input);

        // Assert
        Assert.NotNull(vendaPersistida);
        Assert.Equal(50.00m, output.ValorTotal); // 2 * 25.00 = 50.00
        Assert.Equal(50.00m, vendaPersistida.ValorTotal);

        var item = vendaPersistida.Itens.Single();
        Assert.Equal(25.00m, item.PrecoUnitario);
        Assert.Equal(50.00m, item.Subtotal);
        Assert.NotNull(item.ModificadoresJson);
        Assert.Contains("Ao Ponto", item.ModificadoresJson);
        Assert.Contains("Sem Cebola", item.ModificadoresJson);

        // Apenas o pão deve ter sido debitado (2 un)
        Assert.Equal(48m, insumoPao.QuantidadeEstoque);
        _insumoRepoMock.Verify(i => i.AdicionarMovimentacaoAsync(It.IsAny<MovimentacaoEstoque>(), It.IsAny<CancellationToken>()), Times.Once);
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_ComModificadorAdicionalPago_DeveRecalcularPrecoE_SomarInsumoAdicionalNoBOM()
    {
        // Arrange
        var sut = CreateSut();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        _caixaRepoMock.Setup(c => c.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(caixa);

        // IDs determinísticos para validar a ordenação InsumoId ASC
        var idInsumoMenor = Guid.Parse("11111111-0000-0000-0000-000000000001");
        var idInsumoMaior = Guid.Parse("99999999-0000-0000-0000-000000000009");

        var insumoBacon = new Insumo(idInsumoMenor, _tenantId, "Bacon Defumado", "KG", 1.0m, 40m);
        insumoBacon.CreditarEstoque(5.0m);
        var insumoPao = new Insumo(idInsumoMaior, _tenantId, "Pão Brioche", "UN", 5.0m, 2m);
        insumoPao.CreditarEstoque(30.0m);

        var produto = new Produto(Guid.NewGuid(), _tenantId, "Burger Artesanal", "Burger", 30.00m);
        produto.AdicionarInsumo(insumoPao.Id, 1m); // 1 pao por burger

        _produtoRepoMock
            .Setup(p => p.ObterPorIdsComFichaTecnicaAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto> { produto });

        IReadOnlyList<Guid>? idsBloqueados = null;
        _insumoRepoMock
            .Setup(i => i.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .Callback<IReadOnlyList<Guid>, CancellationToken>((ids, _) => idsBloqueados = ids)
            .ReturnsAsync(new List<Insumo> { insumoBacon, insumoPao });

        Venda? vendaPersistida = null;
        _vendaRepoMock
            .Setup(v => v.AdicionarAsync(It.IsAny<Venda>(), It.IsAny<CancellationToken>()))
            .Callback<Venda, CancellationToken>((v, _) => vendaPersistida = v)
            .Returns(Task.CompletedTask);

        // Modificador adicional: + R$ 4,50 e consome 0.0400 kg de Bacon
        var modAdicionalBacon = new ItemVendaModificadorInputDto(
            Guid.NewGuid(), "+ Bacon Fatiado", 4.50m, insumoBacon.Id, 0.0400m, TipoAcaoModificador.Adicional
        );

        var input = new RegistrarVendaInputDto(
            "Cartao_Credito",
            new List<ItemVendaInputDto>
            {
                new(produto.Id, 2m, new List<ItemVendaModificadorInputDto> { modAdicionalBacon })
            }
        );

        // Act
        var output = await sut.ExecutarAsync(input);

        // Assert
        Assert.NotNull(vendaPersistida);
        // Preço unitário: 30.00 + 4.50 = 34.50. Total: 2 * 34.50 = 69.00
        Assert.Equal(69.00m, output.ValorTotal);
        Assert.Equal(69.00m, vendaPersistida.ValorTotal);

        var item = vendaPersistida.Itens.Single();
        Assert.Equal(34.50m, item.PrecoUnitario);
        Assert.Equal(69.00m, item.Subtotal);

        // Disciplina Anti-Deadlock: Bloqueio deve ser estritamente ordenado por InsumoId ASC
        Assert.NotNull(idsBloqueados);
        Assert.Equal(2, idsBloqueados.Count);
        Assert.Equal(idInsumoMenor, idsBloqueados[0]);
        Assert.Equal(idInsumoMaior, idsBloqueados[1]);

        // Débito no estoque:
        // Pao: 30 - (2 * 1) = 28
        Assert.Equal(28m, insumoPao.QuantidadeEstoque);
        // Bacon: 5.0 - (2 * 0.04) = 4.92
        Assert.Equal(4.9200m, insumoBacon.QuantidadeEstoque);

        // Duas movimentações geradas no Ledger
        _insumoRepoMock.Verify(i => i.AdicionarMovimentacaoAsync(It.IsAny<MovimentacaoEstoque>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_ComEstoqueInsuficienteParaInsumoDoAdicional_DeveDispararRollback()
    {
        // Arrange
        var sut = CreateSut();
        var caixa = new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid());
        _caixaRepoMock.Setup(c => c.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(caixa);

        var insumoPao = new Insumo(Guid.NewGuid(), _tenantId, "Pão Brioche", "UN", 5.0m, 2m);
        insumoPao.CreditarEstoque(30.0m);
        var insumoBacon = new Insumo(Guid.NewGuid(), _tenantId, "Bacon Defumado", "KG", 1.0m, 40m);
        insumoBacon.CreditarEstoque(0.05m); // Apenas 50g

        var produto = new Produto(Guid.NewGuid(), _tenantId, "Burger Artesanal", "Burger", 30.00m);
        produto.AdicionarInsumo(insumoPao.Id, 1m);

        _produtoRepoMock
            .Setup(p => p.ObterPorIdsComFichaTecnicaAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto> { produto });

        _insumoRepoMock
            .Setup(i => i.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumoPao, insumoBacon });

        // Demanda 2 burgers com + Bacon (2 * 0.04 = 0.08 kg, mas temos apenas 0.05 kg)
        var modAdicionalBacon = new ItemVendaModificadorInputDto(
            Guid.NewGuid(), "+ Bacon Fatiado", 4.50m, insumoBacon.Id, 0.0400m, TipoAcaoModificador.Adicional
        );

        var input = new RegistrarVendaInputDto(
            "PIX",
            new List<ItemVendaInputDto>
            {
                new(produto.Id, 2m, new List<ItemVendaModificadorInputDto> { modAdicionalBacon })
            }
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => sut.ExecutarAsync(input));
        Assert.Contains("Saldo insuficiente para o insumo 'Bacon Defumado'", ex.Message);

        _transactionMock.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ObterModificadoresProdutoUseCase_ComProdutoComGrupos_DeveRetornarGruposEOpcoesMapeadas()
    {
        // Arrange
        var produtoId = Guid.NewGuid();
        var grupo = new GrupoModificador(Guid.NewGuid(), _tenantId, "Ponto da Carne", "Escolha 1", true, 1, 1);
        grupo.AdicionarOpcao("Ao Ponto", 0m, TipoAcaoModificador.Culinario);
        grupo.AdicionarOpcao("Bem Passado", 0m, TipoAcaoModificador.Culinario);

        _grupoModificadorRepoMock
            .Setup(g => g.ObterPorProdutoIdAsync(produtoId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GrupoModificador> { grupo });

        var sut = new ObterModificadoresProdutoUseCase(
            _grupoModificadorRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<ObterModificadoresProdutoUseCase>.Instance
        );

        // Act
        var resultado = await sut.ExecutarAsync(produtoId);

        // Assert
        Assert.NotNull(resultado);
        var grupoDto = Assert.Single(resultado);
        Assert.Equal("Ponto da Carne", grupoDto.Nome);
        Assert.True(grupoDto.Obrigatorio);
        Assert.Equal(1, grupoDto.MinimoSelecoes);
        Assert.Equal(1, grupoDto.MaximoSelecoes);
        Assert.Equal(2, grupoDto.Opcoes.Count);
        Assert.Contains(grupoDto.Opcoes, o => o.Nome == "Ao Ponto" && o.TipoAcao == "Culinario");
    }
}
