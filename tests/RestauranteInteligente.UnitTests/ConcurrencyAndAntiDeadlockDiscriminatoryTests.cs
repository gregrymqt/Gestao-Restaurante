using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Estoque.Services;
using RestauranteInteligente.Application.UseCases.Estoque.DTOs;
using RestauranteInteligente.Application.Vendas.DTOs;
using RestauranteInteligente.Application.Vendas.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using Xunit;

namespace RestauranteInteligente.UnitTests;

/// <summary>
/// Bateria de Testes Discriminatórios de Concorrência, Anti-Deadlock e Explosão de BOM.
/// Valida a Cláusula 5 do AGENTS.md:
/// "Operações de baixa transacional de estoque devem obrigatoriamente expandir a ficha técnica (BOM),
/// agrupar os volumes por insumo e ordenar deterministicamente por InsumoId ASC antes de requisitar
/// qualquer bloqueio pessimista (SELECT ... FOR UPDATE)."
/// </summary>
public sealed class ConcurrencyAndAntiDeadlockDiscriminatoryTests
{
    private readonly Guid _tenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ITransactionScope> _transactionMock = new();

    public ConcurrencyAndAntiDeadlockDiscriminatoryTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);

        _unitOfWorkMock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(_transactionMock.Object);
    }

    [Fact]
    public async Task AntiDeadlock_ReceitasCruzadasDisparadasEmOrdensOpostas_DevemSolicitarBloqueioEmOrdemAscendenteIdentica()
    {
        // Arrange: 4 insumos com IDs rigorosamente controlados
        var idA = Guid.Parse("10000000-0000-0000-0000-000000000001");
        var idB = Guid.Parse("20000000-0000-0000-0000-000000000002");
        var idC = Guid.Parse("30000000-0000-0000-0000-000000000003");
        var idD = Guid.Parse("40000000-0000-0000-0000-000000000004");

        var insumoA = new Insumo(idA, _tenantId, "Carne", "KG", 5m, 30m);
        var insumoB = new Insumo(idB, _tenantId, "Queijo", "KG", 5m, 40m);
        var insumoC = new Insumo(idC, _tenantId, "Pão", "UN", 10m, 1m);
        var insumoD = new Insumo(idD, _tenantId, "Molho", "LT", 2m, 15m);

        insumoA.CreditarEstoque(100m);
        insumoB.CreditarEstoque(100m);
        insumoC.CreditarEstoque(100m);
        insumoD.CreditarEstoque(100m);

        var todosInsumos = new List<Insumo> { insumoA, insumoB, insumoC, insumoD };

        IReadOnlyList<Guid>? capturedIdsPedido1 = null;
        IReadOnlyList<Guid>? capturedIdsPedido2 = null;

        var insumoRepoMock = new Mock<IInsumoRepository>();
        insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<Guid> ids, CancellationToken _) =>
            {
                if (capturedIdsPedido1 == null)
                    capturedIdsPedido1 = ids;
                else
                    capturedIdsPedido2 = ids;

                return todosInsumos.Where(i => ids.Contains(i.Id)).ToList();
            });

        var sut = new BaixaEstoqueService(
            _unitOfWorkMock.Object,
            insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<BaixaEstoqueService>.Instance
        );

        // Pedido 1: Solicita na ordem D, B, A, C (embaralhada)
        var itensPedido1 = new List<ItemBaixaEstoqueDto>
        {
            new(idD, 1m),
            new(idB, 2m),
            new(idA, 3m),
            new(idC, 4m)
        };

        // Pedido 2: Solicita na ordem C, A, D, B (outra ordem oposta)
        var itensPedido2 = new List<ItemBaixaEstoqueDto>
        {
            new(idC, 4m),
            new(idA, 3m),
            new(idD, 1m),
            new(idB, 2m)
        };

        // Act
        var res1 = await sut.ExecutarBaixaAsync(itensPedido1, OrigemMovimentacao.Venda);
        var res2 = await sut.ExecutarBaixaAsync(itensPedido2, OrigemMovimentacao.Venda);

        // Assert
        res1.Sucesso.Should().BeTrue();
        res2.Sucesso.Should().BeTrue();

        capturedIdsPedido1.Should().NotBeNull();
        capturedIdsPedido2.Should().NotBeNull();

        var ordemEsperada = new[] { idA, idB, idC, idD };

        // Validação discriminatória: AMBOS os pedidos requisitaram o lock pessimista EXATAMENTE na mesma ordem ascendente
        capturedIdsPedido1.Should().Equal(ordemEsperada, "a disciplina anti-deadlock exige ordenação InsumoId ASC");
        capturedIdsPedido2.Should().Equal(ordemEsperada, "a disciplina anti-deadlock elimina espera circular entre pedidos cruzados");
    }

    [Fact]
    public async Task ExplosaoBOM_MultiplosItensComInsumosCompartilhados_DeveEliminarRedundanciaEOrdenarUnicamente()
    {
        // Arrange: Produtos que compartilham os mesmos insumos em proporções diferentes
        var idCarne = Guid.Parse("11111111-0000-0000-0000-000000000001");
        var idQueijo = Guid.Parse("22222222-0000-0000-0000-000000000002");
        var idPao = Guid.Parse("33333333-0000-0000-0000-000000000003");

        var insumoCarne = new Insumo(idCarne, _tenantId, "Carne Bovina", "KG", 5m, 35m);
        var insumoQueijo = new Insumo(idQueijo, _tenantId, "Queijo Cheddar", "KG", 2m, 45m);
        var insumoPao = new Insumo(idPao, _tenantId, "Pão Brioche", "UN", 10m, 1.5m);

        insumoCarne.CreditarEstoque(100m);
        insumoQueijo.CreditarEstoque(100m);
        insumoPao.CreditarEstoque(100m);

        // Produto 1: Burguer Simples (1 Pão + 0.150kg Carne + 0.030kg Queijo)
        var produto1 = new Produto(Guid.NewGuid(), _tenantId, "Burguer Simples", null, 30m);
        produto1.AdicionarInsumo(idPao, 1m);
        produto1.AdicionarInsumo(idCarne, 0.150m);
        produto1.AdicionarInsumo(idQueijo, 0.030m);

        // Produto 2: Duplo Bacon Cheddar (1 Pão + 0.300kg Carne + 0.060kg Queijo)
        var produto2 = new Produto(Guid.NewGuid(), _tenantId, "Duplo Cheddar", null, 45m);
        produto2.AdicionarInsumo(idPao, 1m);
        produto2.AdicionarInsumo(idCarne, 0.300m);
        produto2.AdicionarInsumo(idQueijo, 0.060m);

        // Produto 3: Porção Extra de Queijo (0.100kg Queijo)
        var produto3 = new Produto(Guid.NewGuid(), _tenantId, "Extra Queijo", null, 12m);
        produto3.AdicionarInsumo(idQueijo, 0.100m);

        var produtosMock = new List<Produto> { produto1, produto2, produto3 };

        IReadOnlyList<Guid>? idsBloqueadosCapturados = null;

        var insumoRepoMock = new Mock<IInsumoRepository>();
        insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .Callback<IReadOnlyList<Guid>, CancellationToken>((ids, _) => idsBloqueadosCapturados = ids)
            .ReturnsAsync(new List<Insumo> { insumoCarne, insumoQueijo, insumoPao });

        var produtoRepoMock = new Mock<IProdutoRepository>();
        produtoRepoMock.Setup(r => r.ObterPorIdsComFichaTecnicaAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(produtosMock);

        var fechamentoRepoMock = new Mock<IFechamentoCaixaRepository>();
        fechamentoRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FechamentoCaixa(Guid.NewGuid(), _tenantId, Guid.NewGuid()));

        var vendaRepoMock = new Mock<IVendaRepository>();
        var streamServiceMock = new Mock<ISseEventStreamService>();

        var sut = new RegistrarVendaUseCase(
            _unitOfWorkMock.Object,
            insumoRepoMock.Object,
            produtoRepoMock.Object,
            vendaRepoMock.Object,
            fechamentoRepoMock.Object,
            streamServiceMock.Object,
            _tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        // Venda combinada: 2x Produto 1 + 1x Produto 2 + 3x Produto 3
        var input = new RegistrarVendaInputDto(
            FormaPagamento: "CARTAO_CREDITO",
            Itens: new List<ItemVendaInputDto>
            {
                new(produto1.Id, 2m),
                new(produto2.Id, 1m),
                new(produto3.Id, 3m)
            }
        );

        // Act
        var output = await sut.ExecutarAsync(input);

        // Assert
        output.Should().NotBeNull();
        output.ValorTotal.Should().Be((2 * 30m) + (1 * 45m) + (3 * 12m)); // 60 + 45 + 36 = 141

        idsBloqueadosCapturados.Should().NotBeNull();
        // Não pode haver IDs repetidos na requisição de lock
        idsBloqueadosCapturados.Should().HaveCount(3);
        idsBloqueadosCapturados.Should().OnlyHaveUniqueItems();
        idsBloqueadosCapturados.Should().Equal(new[] { idCarne, idQueijo, idPao });

        // Validação da dedução exata agregada:
        // Carne: (2 * 0.150) + (1 * 0.300) = 0.600kg -> Restante: 99.400kg
        insumoCarne.QuantidadeEstoque.Should().Be(99.400m);

        // Queijo: (2 * 0.030) + (1 * 0.060) + (3 * 0.100) = 0.060 + 0.060 + 0.300 = 0.420kg -> Restante: 99.580kg
        insumoQueijo.QuantidadeEstoque.Should().Be(99.580m);

        // Pão: (2 * 1) + (1 * 1) = 3un -> Restante: 97un
        insumoPao.QuantidadeEstoque.Should().Be(97m);
    }

    [Fact]
    public async Task ConcorrenciaEsgotamentoEstoque_QuandoDoisPedidosCompetemPorSaldo_DeveDiscriminarUmAprovadoEUmRejeitado()
    {
        // Arrange: Insumo com apenas 10 unidades em estoque
        var insumoId = Guid.NewGuid();
        var insumo = new Insumo(insumoId, _tenantId, "Cerveja Artesanal", "UN", 2m, 12m);
        insumo.CreditarEstoque(10m);

        var insumoRepoMock = new Mock<IInsumoRepository>();
        insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumo });

        var sut = new BaixaEstoqueService(
            _unitOfWorkMock.Object,
            insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<BaixaEstoqueService>.Instance
        );

        var pedidoA = new List<ItemBaixaEstoqueDto> { new(insumoId, 7m) };
        var pedidoB = new List<ItemBaixaEstoqueDto> { new(insumoId, 7m) };

        // Act 1: Primeiro pedido é processado e consome 7 unidades
        var resA = await sut.ExecutarBaixaAsync(pedidoA, OrigemMovimentacao.Venda);

        // Act 2: Segundo pedido concorrente tenta consumir 7 unidades (saldo agora é 3)
        var resB = await sut.ExecutarBaixaAsync(pedidoB, OrigemMovimentacao.Venda);

        // Assert discriminatório
        resA.Sucesso.Should().BeTrue("o primeiro pedido que obteve o lock tinha saldo suficiente");
        insumo.QuantidadeEstoque.Should().Be(3m, "o estoque foi debitado para 3 unidades");

        resB.Sucesso.Should().BeFalse("o segundo pedido deve ser discriminado e rejeitado por saldo insuficiente");
        resB.MensagemErro.Should().Contain("Saldo insuficiente para o insumo 'Cerveja Artesanal'");

        // O estoque permanece estritamente em 3 (não pode ficar negativo)
        insumo.QuantidadeEstoque.Should().Be(3m);

        // O segundo pedido deve ter acionado Rollback da transação
        _transactionMock.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void PrecisaoDecimalFracionaria_numeric18_4_NaoDeveSofrerPerdasPorPontoFlutuante()
    {
        // Arrange: Insumo de alta precisão fracionária (ex: 50 gramas = 0.0500 kg de tempero especial)
        var insumo = new Insumo(Guid.NewGuid(), _tenantId, "Açafrão Espanhol", "KG", 0.0100m, 5000m);
        insumo.CreditarEstoque(1.0000m); // 1 kg inicial

        // Act: 100 baixas consecutivas de exatamente 0.0075 kg (7.5 gramas)
        const decimal doseFracionaria = 0.0075m;
        for (int i = 0; i < 100; i++)
        {
            insumo.DebitarEstoque(doseFracionaria);
        }

        // Assert: 1.0000 - (100 * 0.0075) = 1.0000 - 0.7500 = 0.2500 kg exato
        insumo.QuantidadeEstoque.Should().Be(0.2500m, "cálculos em decimal C# e numeric(18,4) não devem sofrer desvio de ponto flutuante");
    }

    [Fact]
    public async Task ConcorrenciaMultithread_DisparosSimultaneos_DevemManterOrdemDeterministicaSemDeadlock()
    {
        // Arrange: 10 tasks disparadas simultaneamente com ordens embaralhadas
        var id1 = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var id2 = Guid.Parse("00000000-0000-0000-0000-000000000002");
        var id3 = Guid.Parse("00000000-0000-0000-0000-000000000003");

        var insumo1 = new Insumo(id1, _tenantId, "Item 1", "UN", 1m, 10m);
        var insumo2 = new Insumo(id2, _tenantId, "Item 2", "UN", 1m, 10m);
        var insumo3 = new Insumo(id3, _tenantId, "Item 3", "UN", 1m, 10m);

        insumo1.CreditarEstoque(1000m);
        insumo2.CreditarEstoque(1000m);
        insumo3.CreditarEstoque(1000m);

        var ordemGlobalEsperada = new[] { id1, id2, id3 };
        var todasOrdensCapturadas = new System.Collections.Concurrent.ConcurrentBag<IReadOnlyList<Guid>>();

        var insumoRepoMock = new Mock<IInsumoRepository>();
        insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<Guid> ids, CancellationToken _) =>
            {
                todasOrdensCapturadas.Add(ids);
                return new List<Insumo> { insumo1, insumo2, insumo3 };
            });

        var sut = new BaixaEstoqueService(
            _unitOfWorkMock.Object,
            insumoRepoMock.Object,
            _tenantContextMock.Object,
            NullLogger<BaixaEstoqueService>.Instance
        );

        var random = new Random(42);

        // Act: Dispara 20 tasks simultâneas
        var tasks = Enumerable.Range(0, 20).Select(_ =>
        {
            var embaralhado = new List<Guid> { id1, id2, id3 }.OrderBy(__ => random.Next()).ToList();
            var itens = embaralhado.Select(id => new ItemBaixaEstoqueDto(id, 1m)).ToList();
            return Task.Run(() => sut.ExecutarBaixaAsync(itens, OrigemMovimentacao.Venda));
        });

        await Task.WhenAll(tasks);

        // Assert: Todas as 20 execuções concorrentes solicitaram os locks na ordem determinística InsumoId ASC
        todasOrdensCapturadas.Should().HaveCount(20);
        foreach (var ordemCapturada in todasOrdensCapturadas)
        {
            ordemCapturada.Should().Equal(ordemGlobalEsperada,
                "sob concorrência agressiva, nenhuma thread pode subverter a disciplina de ordenação determinística");
        }
    }
}
