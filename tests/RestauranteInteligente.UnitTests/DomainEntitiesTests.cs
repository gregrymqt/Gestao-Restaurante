using FluentAssertions;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class DomainEntitiesTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    [Fact]
    public void Usuario_QuandoDadosValidos_DeveInstanciarComSucesso()
    {
        var usuario = new Usuario(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            nome: "Carlos Eduardo",
            email: "carlos@restaurante.com",
            senhaHash: "hash_seguro_123",
            role: "Admin"
        );

        usuario.Nome.Should().Be("Carlos Eduardo");
        usuario.Email.Should().Be("carlos@restaurante.com");
        usuario.Role.Should().Be("Admin");
        usuario.Ativo.Should().BeTrue();
        usuario.RestauranteId.Should().Be(_tenantId);

        usuario.AtualizarPerfil("Carlos Silva", "Operador");
        usuario.Nome.Should().Be("Carlos Silva");
        usuario.Role.Should().Be("Operador");

        usuario.AtualizarSenha("novo_hash_456");
        usuario.SenhaHash.Should().Be("novo_hash_456");

        usuario.Desativar();
        usuario.Ativo.Should().BeFalse();

        usuario.Ativar();
        usuario.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Usuario_QuandoEmailInvalido_DeveLancarExcecao()
    {
        var act = () => new Usuario(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            nome: "Teste",
            email: "email_invalido_sem_arroba",
            senhaHash: "hash",
            role: "Operador"
        );

        act.Should().Throw<ArgumentException>()
            .WithMessage("*e-mail informado é inválido*");
    }

    [Fact]
    public void ProdutoInsumo_QuandoInstanciado_DeveConterPropriedadesValidas()
    {
        var produtoId = Guid.NewGuid();
        var insumoId = Guid.NewGuid();

        var pi = new ProdutoInsumo(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            produtoId: produtoId,
            insumoId: insumoId,
            quantidadeInsumo: 0.2500m
        );

        pi.QuantidadeInsumo.Should().Be(0.2500m);
        pi.ProdutoId.Should().Be(produtoId);
        pi.InsumoId.Should().Be(insumoId);
        pi.RestauranteId.Should().Be(_tenantId);

        pi.AtualizarQuantidade(0.3000m);
        pi.QuantidadeInsumo.Should().Be(0.3000m);

        var actInvalido = () => pi.AtualizarQuantidade(-1m);
        actInvalido.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Venda_QuandoAdicionarItens_DeveCongelarPrecoUnitarioECalcularTotais()
    {
        var venda = new Venda(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            formaPagamento: "CartaoCredito"
        );

        venda.ValorTotal.Should().Be(0m);
        venda.Status.Should().Be("CONCLUIDA");

        var prodId1 = Guid.NewGuid();
        var prodId2 = Guid.NewGuid();

        // 2 unidades a R$ 25.50 = R$ 51.00
        var item1 = venda.AdicionarItem(prodId1, quantidade: 2m, precoUnitario: 25.50m);
        item1.Subtotal.Should().Be(51.00m);
        item1.PrecoUnitario.Should().Be(25.50m);

        // 1.5 unidades a R$ 10.00 = R$ 15.00
        var item2 = venda.AdicionarItem(prodId2, quantidade: 1.5m, precoUnitario: 10.00m);
        item2.Subtotal.Should().Be(15.00m);

        venda.Itens.Should().HaveCount(2);
        venda.ValorTotal.Should().Be(66.00m);

        var caixaId = Guid.NewGuid();
        venda.VincularFechamentoCaixa(caixaId);
        venda.FechamentoCaixaId.Should().Be(caixaId);

        venda.Cancelar("Cancelamento solicitado pelo cliente");
        venda.Status.Should().Be("CANCELADA");

        var act = () => venda.AdicionarItem(Guid.NewGuid(), 1m, 10m);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*venda cancelada*");
    }

    [Fact]
    public void FechamentoCaixa_CicloAberturaVendasEEncerramento_DeveControlarInvariantes()
    {
        var usuarioId = Guid.NewGuid();
        var caixa = new FechamentoCaixa(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            usuarioId: usuarioId
        );

        caixa.Status.Should().Be("ABERTO");
        caixa.TotalVendas.Should().Be(0m);
        caixa.QuantidadeVendas.Should().Be(0);

        caixa.RegistrarVenda(100.50m);
        caixa.RegistrarVenda(49.50m);

        caixa.TotalVendas.Should().Be(150.00m);
        caixa.QuantidadeVendas.Should().Be(2);

        caixa.Encerrar();
        caixa.Status.Should().Be("FECHADO");
        caixa.DataFechamento.Should().NotBeNull();

        var act = () => caixa.RegistrarVenda(10m);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*caixa fechado*");

        var actFecharNovamente = () => caixa.Encerrar();
        actFecharNovamente.Should().Throw<InvalidOperationException>()
            .WithMessage("*caixa já se encontra encerrado*");
    }

    [Fact]
    public void DadosClimaticos_ValidacoesDeFaixa_DevemSerRespeitadas()
    {
        var dados = new DadosClimaticos(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            data: new DateOnly(2026, 9, 27),
            temperatura: 24.5m,
            umidade: 65.0m,
            precipitacao: 2.5m,
            tipoDado: "HISTORICO"
        );

        dados.Temperatura.Should().Be(24.5m);
        dados.Umidade.Should().Be(65.0m);
        dados.Precipitacao.Should().Be(2.5m);

        var actUmidadeInvalida = () => new DadosClimaticos(
            Guid.NewGuid(), _tenantId, new DateOnly(2026, 9, 27), 20m, 120m, 0m
        );
        actUmidadeInvalida.Should().Throw<ArgumentOutOfRangeException>();

        var actPrecipitacaoInvalida = () => new DadosClimaticos(
            Guid.NewGuid(), _tenantId, new DateOnly(2026, 9, 27), 20m, 50m, -5m
        );
        actPrecipitacaoInvalida.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Previsao_QuandoValida_DeveRegistrarPrevisaoDeDemanda()
    {
        var produtoId = Guid.NewGuid();
        var previsao = new Previsao(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            produtoId: produtoId,
            dataPrevisao: new DateOnly(2026, 9, 28),
            dataReferencia: new DateOnly(2026, 9, 27),
            quantidadePrevista: 45.5000m,
            modeloVersao: "v1.0.0-HistGradientBoosting"
        );

        previsao.QuantidadePrevista.Should().Be(45.5000m);
        previsao.ModeloVersao.Should().Be("v1.0.0-HistGradientBoosting");

        var actQtdNegativa = () => new Previsao(
            Guid.NewGuid(), _tenantId, produtoId, new DateOnly(2026, 9, 28), new DateOnly(2026, 9, 27), -1m, "v1"
        );
        actQtdNegativa.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Produto_QuandoAdicionaInsumos_DeveComporFichaTecnicaEncapsulada()
    {
        var produto = new Produto(
            id: Guid.NewGuid(),
            restauranteId: _tenantId,
            nome: "Pizza Margherita",
            descricao: "Molho, mussarela e manjericão",
            preco: 55.00m
        );

        var insumoFarinha = Guid.NewGuid();
        var insumoQueijo = Guid.NewGuid();

        produto.AdicionarInsumo(insumoFarinha, 0.3500m);
        produto.AdicionarInsumo(insumoQueijo, 0.2000m);

        produto.FichaTecnica.Should().HaveCount(2);
        produto.FichaTecnica.Should().Contain(pi => pi.InsumoId == insumoFarinha && pi.QuantidadeInsumo == 0.3500m);
        produto.FichaTecnica.Should().Contain(pi => pi.InsumoId == insumoQueijo && pi.QuantidadeInsumo == 0.2000m);
    }
}
