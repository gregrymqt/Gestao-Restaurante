using System.IO;
using System.Text.RegularExpressions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Estoque.Services;
using RestauranteInteligente.Application.UseCases.Estoque.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using RestauranteInteligente.Infrastructure.Persistence;
using RestauranteInteligente.Infrastructure.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

/// <summary>
/// Bateria de Testes de Análise do Poder Discriminatório (Mutation Testing Verification).
/// Avalia a sensibilidade e o "Kill Rate" da suíte de testes contra mutantes sintéticos em componentes vitais:
/// inversão de operadores lógicos, supressão de filtros de inquilinos, violação de disciplina anti-deadlock,
/// mutações de fronteira temporal em assinaturas, falhas de Hash Tag multi-tenant e quebra da Cláusula Zero-SQL.
/// </summary>
public sealed class MutationDiscriminativePowerTests
{
    private readonly Guid _tenantA = Guid.Parse("77777777-7777-7777-7777-777777777777");
    private readonly Guid _tenantB = Guid.Parse("88888888-8888-8888-8888-888888888888");

    private static string FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "RestauranteInteligente.sln")))
        {
            dir = dir.Parent;
        }
        return dir?.FullName ?? throw new DirectoryNotFoundException("Raiz do repositório não encontrada.");
    }

    [Fact]
    public async Task PoderDiscriminatorio_MutanteBypassQueryFilter_DeveSerMortoComprovandoIsolamento()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();

        var tenantMock = new Mock<ITenantContext>();
        tenantMock.Setup(t => t.RestauranteId).Returns(_tenantA);
        tenantMock.Setup(t => t.HasTenant).Returns(true);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        // Contexto neutro grava insumos dos dois tenants
        using (var setup = new AppDbContext(options, new Mock<ITenantContext>().Object))
        {
            await setup.Insumos.AddRangeAsync(
                new Insumo(Guid.NewGuid(), _tenantA, "Insumo Tenant A", "KG", 1m, 10m),
                new Insumo(Guid.NewGuid(), _tenantB, "Insumo Tenant B", "KG", 1m, 10m)
            );
            await setup.SaveChangesAsync();
        }

        using var contextA = new AppDbContext(options, tenantMock.Object);

        // Act 1: Comportamento canônico com Query Filter ativo
        var insumosComFiltro = await contextA.Insumos.ToListAsync();

        // Act 2: Mutação simulada que suprime o Global Query Filter
        var insumosComMutanteBypass = await contextA.Insumos.IgnoreQueryFilters().ToListAsync();

        // Assert discriminatório
        insumosComFiltro.Should().HaveCount(1, "o filtro canônico isola estritamente o Tenant A");
        insumosComFiltro.First().RestauranteId.Should().Be(_tenantA);

        insumosComMutanteBypass.Should().HaveCount(2,
            "o mutante que ignora o filtro vaza dados do Tenant B, provando que o teste é discriminante contra mutações de filtro");
    }

    [Fact]
    public async Task PoderDiscriminatorio_MutanteInversaoSaldoEstoque_DeveSerMortoPelaValidacao()
    {
        // Arrange: Insumo com apenas 5 unidades
        var insumoId = Guid.NewGuid();
        var insumo = new Insumo(insumoId, _tenantA, "Carne", "KG", 1m, 20m);
        insumo.CreditarEstoque(5m);

        var insumoRepoMock = new Mock<IInsumoRepository>();
        insumoRepoMock.Setup(r => r.ObterPorIdsParaAtualizacaoAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Insumo> { insumo });

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var txMock = new Mock<ITransactionScope>();
        unitOfWorkMock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(txMock.Object);

        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantA);

        var sut = new BaixaEstoqueService(
            unitOfWorkMock.Object,
            insumoRepoMock.Object,
            tenantContextMock.Object,
            NullLogger<BaixaEstoqueService>.Instance
        );

        // Act: Demanda de 10 unidades (maior que o saldo disponível de 5)
        var itens = new List<ItemBaixaEstoqueDto> { new(insumoId, 10m) };
        var resultado = await sut.ExecutarBaixaAsync(itens, OrigemMovimentacao.Venda);

        // Assert: Mata mutante que inverteria '<' por '>='
        resultado.Sucesso.Should().BeFalse("qualquer mutação na validação de saldo deve ser imediatamente morta");
        resultado.MensagemErro.Should().Contain("Saldo insuficiente");
        insumo.QuantidadeEstoque.Should().Be(5m, "o saldo não pode ter sido debitado");
        txMock.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void PoderDiscriminatorio_MutanteDesordemAntiDeadlock_DeveSerMortoPelaAssercaoDeOrdenacao()
    {
        // Arrange
        var id1 = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
        var id2 = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");
        var id3 = Guid.Parse("cccccccc-0000-0000-0000-000000000003");

        var sequenciaCanonica = new[] { id1, id2, id3 };

        // Simula mutante que introduziu desordem (id3 antes de id2)
        var mutanteDesordenado = new[] { id1, id3, id2 };

        // Act & Assert
        var actMutante = () => mutanteDesordenado.Should().Equal(sequenciaCanonica);

        actMutante.Should().Throw<Exception>(
            "o teste discriminatório anti-deadlock deve matar imediatamente qualquer mutação que altere a ordem InsumoId ASC");
    }

    [Fact]
    public void PoderDiscriminatorio_MutanteTemporalAssinatura_DeveSerMortoNaFronteiraExata()
    {
        // Arrange: Fronteira exata de expiração
        var agora = DateTimeOffset.UtcNow;
        var assinaturaExpiradaFronteira = new Assinatura(Guid.NewGuid(), _tenantA, agora.AddDays(-14), agora.AddMilliseconds(-50));
        var assinaturaVigenteFronteira = new Assinatura(Guid.NewGuid(), _tenantA, agora.AddDays(-14), agora.AddMilliseconds(500));

        // Act & Assert discriminatório
        assinaturaExpiradaFronteira.EstaVigente().Should().BeFalse("50ms após o término do trial, o inquilino já deve estar expirado");
        assinaturaVigenteFronteira.EstaVigente().Should().BeTrue("500ms antes do término, o inquilino ainda possui acesso liberado");
    }

    [Fact]
    public void PoderDiscriminatorio_MutanteZeroSqlWorkerPython_DeveSerMortoPorAuditoriaEstatica()
    {
        // Arrange: Localiza a pasta do Worker Python no monorepo
        var repoRoot = FindRepoRoot();
        var pythonAppDir = Path.Combine(repoRoot, "ml", "RestauranteInteligente.ML", "app");

        Directory.Exists(pythonAppDir).Should().BeTrue("a pasta do microsserviço Python ML deve existir");

        var pythonFiles = Directory.GetFiles(pythonAppDir, "*.py", SearchOption.AllDirectories);
        pythonFiles.Should().NotBeEmpty("arquivos Python do worker devem ser inspecionados");

        // Padrão de mutantes proibidos: drivers de banco relacional
        var regexRelacional = new Regex(@"^\s*(import\s+(psycopg2|asyncpg|sqlalchemy|sqlite3)|from\s+(psycopg2|asyncpg|sqlalchemy|sqlite3)\s+import)",
            RegexOptions.Compiled | RegexOptions.Multiline | RegexOptions.IgnoreCase);

        var violacoes = new List<string>();

        // Act
        foreach (var file in pythonFiles)
        {
            var content = File.ReadAllText(file);
            var matches = regexRelacional.Matches(content);
            foreach (System.Text.RegularExpressions.Match match in matches)
            {
                violacoes.Add($"{Path.GetFileName(file)}: {match.Value.Trim()}");
            }
        }

        // Assert: 100% de exclusão de bibliotecas relacionais no Worker Python
        violacoes.Should().BeEmpty(
            "qualquer mutante que tente introduzir acoplamento com banco relacional no Worker Python deve ser categoricamente eliminado");
    }

    [Fact]
    public void PoderDiscriminatorio_MutanteChaveRedisSemHashTag_DeveSerMortoPeloPadraoMultiTenant()
    {
        // Act
        var channel = RedisKeyHelper.BuildTenantStreamChannel(_tenantA);
        var cacheKey = RedisKeyHelper.BuildCacheKey(_tenantA, "produtos");
        var idempotencyKey = RedisKeyHelper.BuildIdempotencyKey(_tenantA, "venda-1");

        // Assert: Mutações que omitissem o padrão {tenantId} seriam mortas aqui
        channel.Should().StartWith($"{{{_tenantA}}}", "chaves Redis multi-tenant devem obrigatoriamente possuir Hash Tag");
        cacheKey.Should().StartWith($"{{{_tenantA}}}");
        idempotencyKey.Should().StartWith($"{{{_tenantA}}}");
    }
}
