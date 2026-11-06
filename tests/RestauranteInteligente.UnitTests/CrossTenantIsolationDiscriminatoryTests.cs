using System.Data.Common;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
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
using RestauranteInteligente.Infrastructure.Persistence;
using RestauranteInteligente.Infrastructure.Persistence.Interceptors;
using RestauranteInteligente.Infrastructure.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

/// <summary>
/// Bateria de Testes Discriminatórios de Isolamento Multi-Inquilino (Cross-Tenant Discrimination).
/// Valida se a arquitetura em dupla camada (Global Query Filter no EF Core + PostgreSQL RLS)
/// e a camada de aplicação discriminam categoricamente os dados, canais e operações entre inquilinos distintos,
/// garantindo proteção anti-IDOR, ausência de vazamento de dados e rejeição de escritas cruzadas.
/// </summary>
public sealed class CrossTenantIsolationDiscriminatoryTests
{
    private readonly Guid _tenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _tenantB = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private AppDbContext CreateDbContext(Guid? tenantId, string dbName)
    {
        var tenantMock = new Mock<ITenantContext>();
        if (tenantId.HasValue)
        {
            tenantMock.Setup(t => t.RestauranteId).Returns(tenantId.Value);
            tenantMock.Setup(t => t.HasTenant).Returns(true);
        }
        else
        {
            tenantMock.Setup(t => t.HasTenant).Returns(false);
        }

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new AppDbContext(options, tenantMock.Object);
    }

    [Fact]
    public async Task QueryFilter_LeituraDireta_DeveDiscriminarRegistrosDoInquilinoSemVazarDadosDoOutro()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();

        // Popula base compartilhada usando contexto neutro (sem filtro de tenant ativo)
        using (var setupContext = CreateDbContext(null, dbName))
        {
            var insumoA = new Insumo(Guid.NewGuid(), _tenantA, "Tomate Orgânico", "KG", 5m, 8m);
            var insumoB = new Insumo(Guid.NewGuid(), _tenantB, "Queijo Brie Importado", "KG", 2m, 75m);

            var produtoA = new Produto(Guid.NewGuid(), _tenantA, "Pizza Margherita", "Molho e tomate", 45m);
            var produtoB = new Produto(Guid.NewGuid(), _tenantB, "Hambúrguer Trufado", "Blend especial", 60m);

            var usuarioA = new Usuario(Guid.NewGuid(), _tenantA, "Gestor A", "gestor.a@restaurante.com", "hash123", "Manager");
            var usuarioB = new Usuario(Guid.NewGuid(), _tenantB, "Gestor B", "gestor.b@restaurante.com", "hash456", "Manager");

            var caixaA = new FechamentoCaixa(Guid.NewGuid(), _tenantA, usuarioA.Id);
            var caixaB = new FechamentoCaixa(Guid.NewGuid(), _tenantB, usuarioB.Id);

            var vendaA = new Venda(Guid.NewGuid(), _tenantA, "PIX", caixaA.Id);
            var vendaB = new Venda(Guid.NewGuid(), _tenantB, "CARTAO_CREDITO", caixaB.Id);

            await setupContext.Insumos.AddRangeAsync(insumoA, insumoB);
            await setupContext.Produtos.AddRangeAsync(produtoA, produtoB);
            await setupContext.Usuarios.AddRangeAsync(usuarioA, usuarioB);
            await setupContext.FechamentosCaixa.AddRangeAsync(caixaA, caixaB);
            await setupContext.Vendas.AddRangeAsync(vendaA, vendaB);

            await setupContext.SaveChangesAsync();
        }

        // Act & Assert sob a perspectiva estrita do Tenant A
        using (var contextA = CreateDbContext(_tenantA, dbName))
        {
            var insumosA = await contextA.Insumos.ToListAsync();
            insumosA.Should().ContainSingle();
            insumosA.First().Nome.Should().Be("Tomate Orgânico");
            insumosA.First().RestauranteId.Should().Be(_tenantA);

            var produtosA = await contextA.Produtos.ToListAsync();
            produtosA.Should().ContainSingle();
            produtosA.First().Nome.Should().Be("Pizza Margherita");
            produtosA.First().RestauranteId.Should().Be(_tenantA);

            var usuariosA = await contextA.Usuarios.ToListAsync();
            usuariosA.Should().ContainSingle();
            usuariosA.First().Email.Should().Be("gestor.a@restaurante.com");

            var caixasA = await contextA.FechamentosCaixa.ToListAsync();
            caixasA.Should().ContainSingle();
            caixasA.First().RestauranteId.Should().Be(_tenantA);

            var vendasA = await contextA.Vendas.ToListAsync();
            vendasA.Should().ContainSingle();
            vendasA.First().FormaPagamento.Should().Be("PIX");
        }
    }

    [Fact]
    public async Task QueryFilter_LeituraPorId_QuandoIdPertenceAoTenantB_DeveRetornarNuloComoSeNaoExistisse()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var idInsumoB = Guid.NewGuid();
        var idProdutoB = Guid.NewGuid();
        var idVendaB = Guid.NewGuid();

        using (var setupContext = CreateDbContext(null, dbName))
        {
            var insumoB = new Insumo(idInsumoB, _tenantB, "Farinha Especial B", "KG", 10m, 5m);
            var produtoB = new Produto(idProdutoB, _tenantB, "Pão Gourmet B", null, 15m);
            var vendaB = new Venda(idVendaB, _tenantB, "DINHEIRO");

            await setupContext.Insumos.AddAsync(insumoB);
            await setupContext.Produtos.AddAsync(produtoB);
            await setupContext.Vendas.AddAsync(vendaB);
            await setupContext.SaveChangesAsync();
        }

        // Act & Assert sob a perspectiva do Tenant A tentando acessar IDs de B (Anti-IDOR)
        using (var contextA = CreateDbContext(_tenantA, dbName))
        {
            var insumoTentado = await contextA.Insumos.FirstOrDefaultAsync(i => i.Id == idInsumoB);
            var produtoTentado = await contextA.Produtos.FirstOrDefaultAsync(p => p.Id == idProdutoB);
            var vendaTentada = await contextA.Vendas.FirstOrDefaultAsync(v => v.Id == idVendaB);

            insumoTentado.Should().BeNull("o Global Query Filter deve discriminar e ocultar insumos de outros inquilinos");
            produtoTentado.Should().BeNull("o Global Query Filter deve discriminar e ocultar produtos de outros inquilinos");
            vendaTentada.Should().BeNull("o Global Query Filter deve discriminar e ocultar vendas de outros inquilinos");
        }
    }

    [Theory]
    [InlineData("Insumo")]
    [InlineData("Produto")]
    [InlineData("Venda")]
    [InlineData("FechamentoCaixa")]
    [InlineData("Usuario")]
    [InlineData("MovimentacaoEstoque")]
    public async Task PersistenciaEntidade_ComTenantDivergenteDoContextoAtivo_DeveDispararViolacaoDeSeguranca(string tipoEntidade)
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();

        using var contextA = CreateDbContext(_tenantA, dbName);

        IRestauranteEntity entidadeMaliciosa = tipoEntidade switch
        {
            "Insumo" => new Insumo(Guid.NewGuid(), _tenantB, "Insumo Infiltrado", "UN", 1m, 1m),
            "Produto" => new Produto(Guid.NewGuid(), _tenantB, "Produto Infiltrado", "Desc", 10m),
            "Venda" => new Venda(Guid.NewGuid(), _tenantB, "PIX"),
            "FechamentoCaixa" => new FechamentoCaixa(Guid.NewGuid(), _tenantB, Guid.NewGuid()),
            "Usuario" => new Usuario(Guid.NewGuid(), _tenantB, "Invasor", "invasor@b.com", "hash", "Admin"),
            "MovimentacaoEstoque" => new MovimentacaoEstoque(Guid.NewGuid(), _tenantB, Guid.NewGuid(), TipoMovimentacao.Entrada, OrigemMovimentacao.Compra, 10m),
            _ => throw new ArgumentOutOfRangeException(nameof(tipoEntidade))
        };

        await contextA.AddAsync(entidadeMaliciosa);

        // Act
        var act = async () => await contextA.SaveChangesAsync();

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*VIOLAÇÃO DE SEGURANÇA: Tentativa de persistir entidade com RestauranteId*");
    }

    [Fact]
    public async Task RegistrarVenda_ComProdutoDeOutroTenant_DeveDiscriminarERejeitarVenda()
    {
        // Arrange
        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantA);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var insumoRepoMock = new Mock<IInsumoRepository>();
        var produtoRepoMock = new Mock<IProdutoRepository>();
        var vendaRepoMock = new Mock<IVendaRepository>();
        var fechamentoRepoMock = new Mock<IFechamentoCaixaRepository>();
        var streamServiceMock = new Mock<ISseEventStreamService>();

        // Há caixa aberto para o Tenant A
        fechamentoRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FechamentoCaixa(Guid.NewGuid(), _tenantA, Guid.NewGuid()));

        var idProdutoTenantB = Guid.NewGuid();

        // O repositório respeita o isolamento de tenant e não encontra o produto de B para o tenant A
        produtoRepoMock.Setup(r => r.ObterPorIdsComFichaTecnicaAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Produto>());

        var sut = new RegistrarVendaUseCase(
            unitOfWorkMock.Object,
            insumoRepoMock.Object,
            produtoRepoMock.Object,
            vendaRepoMock.Object,
            fechamentoRepoMock.Object,
            streamServiceMock.Object,
            tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        var input = new RegistrarVendaInputDto(
            FormaPagamento: "PIX",
            Itens: new List<ItemVendaInputDto> { new(idProdutoTenantB, 1m) }
        );

        // Act
        var act = async () => await sut.ExecutarAsync(input);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Um ou mais produtos informados não foram localizados no catálogo do restaurante.");
    }

    [Fact]
    public async Task RegistrarVenda_ComCaixaAbertoApenasDeOutroTenant_DeveDiscriminarERejeitarVenda()
    {
        // Arrange
        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantA);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var insumoRepoMock = new Mock<IInsumoRepository>();
        var produtoRepoMock = new Mock<IProdutoRepository>();
        var vendaRepoMock = new Mock<IVendaRepository>();
        var fechamentoRepoMock = new Mock<IFechamentoCaixaRepository>();
        var streamServiceMock = new Mock<ISseEventStreamService>();

        // Simula que para o Tenant A não há caixa aberto (mesmo que haja para o B)
        fechamentoRepoMock.Setup(r => r.ObterCaixaAbertoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((FechamentoCaixa?)null);

        var sut = new RegistrarVendaUseCase(
            unitOfWorkMock.Object,
            insumoRepoMock.Object,
            produtoRepoMock.Object,
            vendaRepoMock.Object,
            fechamentoRepoMock.Object,
            streamServiceMock.Object,
            tenantContextMock.Object,
            NullLogger<RegistrarVendaUseCase>.Instance
        );

        var input = new RegistrarVendaInputDto(
            FormaPagamento: "PIX",
            Itens: new List<ItemVendaInputDto> { new(Guid.NewGuid(), 1m) }
        );

        // Act
        var act = async () => await sut.ExecutarAsync(input);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Operação cancelada: Não há sessão de caixa aberta para registrar vendas no restaurante.");
    }

    [Fact]
    public async Task BaixaEstoque_ComInsumoDeOutroTenant_DeveDiscriminarERejeitarBaixa()
    {
        // Arrange
        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantA);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var transactionMock = new Mock<ITransactionScope>();
        unitOfWorkMock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(transactionMock.Object);

        var insumoRepoMock = new Mock<IInsumoRepository>();
        var loggerMock = new Mock<Microsoft.Extensions.Logging.ILogger<BaixaEstoqueService>>();

        // Insumo do Tenant B não existe na busca filtrada por Tenant A
        insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo>());

        var sut = new BaixaEstoqueService(
            unitOfWorkMock.Object,
            insumoRepoMock.Object,
            tenantContextMock.Object,
            loggerMock.Object
        );

        var itensBaixa = new List<ItemBaixaEstoqueDto>
        {
            new(Guid.NewGuid(), 5m)
        };

        // Act
        var resultado = await sut.ExecutarBaixaAsync(itensBaixa, OrigemMovimentacao.Venda);

        // Assert
        resultado.Sucesso.Should().BeFalse("a baixa com insumo de outro inquilino deve ser discriminada e rejeitada");
        resultado.MensagemErro.Should().Be("Um ou mais insumos solicitados não foram localizados no restaurante.");
    }

    [Fact]
    public void RedisKeyHelper_CanaisEChaves_DevemSerCategoricamenteDiscriminadosPorTenant()
    {
        // Act
        var channelA = RedisKeyHelper.BuildTenantStreamChannel(_tenantA);
        var channelB = RedisKeyHelper.BuildTenantStreamChannel(_tenantB);

        var cacheA = RedisKeyHelper.BuildCacheKey(_tenantA, "produtos");
        var cacheB = RedisKeyHelper.BuildCacheKey(_tenantB, "produtos");

        var idemA = RedisKeyHelper.BuildIdempotencyKey(_tenantA, "venda-001");
        var idemB = RedisKeyHelper.BuildIdempotencyKey(_tenantB, "venda-001");

        // Assert
        channelA.Should().NotBe(channelB);
        channelA.Should().Contain(_tenantA.ToString());
        channelB.Should().Contain(_tenantB.ToString());

        cacheA.Should().NotBe(cacheB);
        cacheA.Should().Contain(_tenantA.ToString());

        idemA.Should().NotBe(idemB);
        idemA.Should().Contain(_tenantA.ToString());
    }

    [Fact]
    public async Task PostgresRlsTransactionInterceptor_QuandoSemTenantAtivo_NaoDeveDispararComandoDeSessao()
    {
        // Arrange
        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.HasTenant).Returns(false);

        var interceptor = new PostgresRlsTransactionInterceptor(
            tenantContextMock.Object,
            NullLogger<PostgresRlsTransactionInterceptor>.Instance
        );

        var connection = new TestDbConnection();
        var transactionMock = new Mock<DbTransaction>();

        // Act
        var result = await interceptor.TransactionStartedAsync(
            connection,
            null!,
            transactionMock.Object
        );

        // Assert: Nenhuma tentativa de criar comando deve ocorrer quando HasTenant for false
        result.Should().Be(transactionMock.Object);
        connection.CommandCreated.Should().BeFalse("o interceptor de RLS não deve criar comandos quando não há tenant ativo");
    }

    [Fact]
    public async Task PostgresRlsTransactionInterceptor_QuandoComTenantAtivo_DeveExecutarSetConfigLocalmente()
    {
        // Arrange
        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantA);

        var interceptor = new PostgresRlsTransactionInterceptor(
            tenantContextMock.Object,
            NullLogger<PostgresRlsTransactionInterceptor>.Instance
        );

        var connection = new TestDbConnection();
        var transactionMock = new Mock<DbTransaction>();

        // Act
        var result = await interceptor.TransactionStartedAsync(
            connection,
            null!,
            transactionMock.Object
        );

        // Assert: O comando SQL deve ser executado com o identificador do inquilino em escopo estritamente local (is_local = true)
        result.Should().Be(transactionMock.Object);
        connection.CommandCreated.Should().BeTrue();
        connection.LastCommand.Should().NotBeNull();
        connection.LastCommand!.CommandText.Should().Be("SELECT set_config('app.current_restaurante_id', @restauranteId, true);");
        connection.LastCommand!.LastAddedParameter.Should().NotBeNull();
        connection.LastCommand!.LastAddedParameter!.ParameterName.Should().Be("restauranteId");
        connection.LastCommand!.LastAddedParameter!.Value.Should().Be(_tenantA.ToString());
        connection.LastCommand!.ExecuteNonQueryAsyncCalled.Should().BeTrue("o comando de RLS deve ser executado no PostgreSQL");
    }

#pragma warning disable CS8765
    private sealed class TestDbConnection : DbConnection
    {
        public bool CommandCreated { get; private set; }
        public TestDbCommand? LastCommand { get; private set; }

        protected override DbCommand CreateDbCommand()
        {
            CommandCreated = true;
            LastCommand = new TestDbCommand();
            return LastCommand;
        }

        public override string ConnectionString { get; set; } = string.Empty;
        public override string Database => "test_db";
        public override string DataSource => "localhost";
        public override string ServerVersion => "16.0";
        public override System.Data.ConnectionState State => System.Data.ConnectionState.Open;
        public override void ChangeDatabase(string databaseName) { }
        public override void Close() { }
        public override void Open() { }
        protected override DbTransaction BeginDbTransaction(System.Data.IsolationLevel isolationLevel) => throw new NotImplementedException();
    }

    private sealed class TestDbCommand : DbCommand
    {
        public override string CommandText { get; set; } = string.Empty;
        public override int CommandTimeout { get; set; }
        public override System.Data.CommandType CommandType { get; set; }
        public override bool DesignTimeVisible { get; set; }
        public override System.Data.UpdateRowSource UpdatedRowSource { get; set; }
        protected override DbConnection? DbConnection { get; set; }
        protected override DbParameterCollection DbParameterCollection => _parameters;
        protected override DbTransaction? DbTransaction { get; set; }

        public bool ExecuteNonQueryAsyncCalled { get; private set; }
        public TestDbParameter? LastAddedParameter => _parameters.LastParameter;

        private readonly TestDbParameterCollection _parameters = new();

        public override void Cancel() { }
        public override int ExecuteNonQuery() => 1;
        public override Task<int> ExecuteNonQueryAsync(CancellationToken cancellationToken)
        {
            ExecuteNonQueryAsyncCalled = true;
            return Task.FromResult(1);
        }
        public override object? ExecuteScalar() => null;
        public override void Prepare() { }
        protected override DbParameter CreateDbParameter() => new TestDbParameter();
        protected override DbDataReader ExecuteDbDataReader(System.Data.CommandBehavior behavior) => throw new NotImplementedException();
    }

    private sealed class TestDbParameter : DbParameter
    {
        public override System.Data.DbType DbType { get; set; }
        public override System.Data.ParameterDirection Direction { get; set; }
        public override bool IsNullable { get; set; }
        public override string ParameterName { get; set; } = string.Empty;
        public override string SourceColumn { get; set; } = string.Empty;
        public override object? Value { get; set; }
        public override bool SourceColumnNullMapping { get; set; }
        public override int Size { get; set; }
        public override void ResetDbType() { }
    }

    private sealed class TestDbParameterCollection : DbParameterCollection
    {
        private readonly List<TestDbParameter> _list = new();
        public TestDbParameter? LastParameter => _list.LastOrDefault();

        public override int Add(object? value)
        {
            if (value is TestDbParameter param)
            {
                _list.Add(param);
                return _list.Count - 1;
            }
            return -1;
        }

        public override void AddRange(Array values)
        {
            foreach (var item in values)
            {
                if (item is TestDbParameter param) _list.Add(param);
            }
        }

        public override void Clear() => _list.Clear();
        public override bool Contains(object? value) => value is TestDbParameter p && _list.Contains(p);
        public override int IndexOf(object? value) => value is TestDbParameter p ? _list.IndexOf(p) : -1;
        public override void Insert(int index, object? value) { if (value is TestDbParameter p) _list.Insert(index, p); }
        public override bool IsFixedSize => false;
        public override bool IsReadOnly => false;
        public override bool IsSynchronized => false;
        public override void Remove(object? value) { if (value is TestDbParameter p) _list.Remove(p); }
        public override void RemoveAt(int index) => _list.RemoveAt(index);
        public override void RemoveAt(string parameterName) => _list.RemoveAll(p => p.ParameterName == parameterName);
        public override int Count => _list.Count;
        public override object SyncRoot => _list;
        public override int IndexOf(string parameterName) => _list.FindIndex(p => p.ParameterName == parameterName);
        public override bool Contains(string parameterName) => _list.Exists(p => p.ParameterName == parameterName);
        public override void CopyTo(Array array, int index) => ((System.Collections.ICollection)_list).CopyTo(array, index);
        public override System.Collections.IEnumerator GetEnumerator() => _list.GetEnumerator();
        protected override DbParameter GetParameter(int index) => _list[index];
        protected override DbParameter GetParameter(string parameterName) => _list.First(p => p.ParameterName == parameterName);
        protected override void SetParameter(int index, DbParameter value) => _list[index] = (TestDbParameter)value;
        protected override void SetParameter(string parameterName, DbParameter value)
        {
            var idx = IndexOf(parameterName);
            if (idx >= 0) _list[idx] = (TestDbParameter)value;
        }
    }
}
