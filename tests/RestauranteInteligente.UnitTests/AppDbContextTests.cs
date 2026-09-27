using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using RestauranteInteligente.Infrastructure.Persistence;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class AppDbContextTests
{
    private readonly Guid _tenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _tenantB = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private AppDbContext CreateDbContext(Guid tenantId, string dbName)
    {
        var tenantMock = new Mock<ITenantContext>();
        tenantMock.Setup(t => t.RestauranteId).Returns(tenantId);
        tenantMock.Setup(t => t.HasTenant).Returns(true);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new AppDbContext(options, tenantMock.Object);
    }

    [Fact]
    public async Task QueryFilter_QuandoRestauranteAtivo_DeveRetornarApenasRegistrosDoInquilino()
    {
        var dbName = Guid.NewGuid().ToString();

        // 1. Grava insumo do Tenant A e insumo do Tenant B com context neutro
        using (var seedContext = CreateDbContext(_tenantA, dbName))
        {
            var insumoA = new Insumo(Guid.NewGuid(), _tenantA, "Tomate Seco", "KG", 5m, 12.50m);
            await seedContext.Insumos.AddAsync(insumoA);
            await seedContext.SaveChangesAsync();
        }

        using (var seedContext = CreateDbContext(_tenantB, dbName))
        {
            var insumoB = new Insumo(Guid.NewGuid(), _tenantB, "Queijo Brie", "KG", 2m, 45.00m);
            await seedContext.Insumos.AddAsync(insumoB);
            await seedContext.SaveChangesAsync();
        }

        // 2. Consulta como Tenant A: deve retornar apenas insumos do Tenant A
        using (var queryContext = CreateDbContext(_tenantA, dbName))
        {
            var insumos = await queryContext.Insumos.ToListAsync();

            insumos.Should().HaveCount(1);
            insumos.First().Nome.Should().Be("Tomate Seco");
            insumos.First().RestauranteId.Should().Be(_tenantA);
        }

        // 3. Consulta como Tenant B: deve retornar apenas insumos do Tenant B
        using (var queryContext = CreateDbContext(_tenantB, dbName))
        {
            var insumos = await queryContext.Insumos.ToListAsync();

            insumos.Should().HaveCount(1);
            insumos.First().Nome.Should().Be("Queijo Brie");
            insumos.First().RestauranteId.Should().Be(_tenantB);
        }
    }

    [Fact]
    public async Task LedgerEstoque_QuandoTentativaDeUpdate_DeveLancarExcecaoAppendOnly()
    {
        var dbName = Guid.NewGuid().ToString();
        var movimentacaoId = Guid.NewGuid();

        using (var context = CreateDbContext(_tenantA, dbName))
        {
            var mov = new MovimentacaoEstoque(
                id: movimentacaoId,
                restauranteId: _tenantA,
                insumoId: Guid.NewGuid(),
                tipo: TipoMovimentacao.Entrada,
                origem: OrigemMovimentacao.Compra,
                quantidade: 50m,
                custoUnitarioMomento: 10m
            );

            await context.MovimentacoesEstoque.AddAsync(mov);
            await context.SaveChangesAsync();
        }

        using (var context = CreateDbContext(_tenantA, dbName))
        {
            var movSalva = await context.MovimentacoesEstoque.FirstAsync(m => m.Id == movimentacaoId);

            // Simula tentativa de alteração indevida no ledger
            context.Entry(movSalva).State = EntityState.Modified;

            var act = async () => await context.SaveChangesAsync();

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*ledger estritamente imutável (append-only)*");
        }
    }

    [Fact]
    public async Task LedgerEstoque_QuandoTentativaDeDelete_DeveLancarExcecaoAppendOnly()
    {
        var dbName = Guid.NewGuid().ToString();
        var movimentacaoId = Guid.NewGuid();

        using (var context = CreateDbContext(_tenantA, dbName))
        {
            var mov = new MovimentacaoEstoque(
                id: movimentacaoId,
                restauranteId: _tenantA,
                insumoId: Guid.NewGuid(),
                tipo: TipoMovimentacao.Entrada,
                origem: OrigemMovimentacao.Compra,
                quantidade: 50m,
                custoUnitarioMomento: 10m
            );

            await context.MovimentacoesEstoque.AddAsync(mov);
            await context.SaveChangesAsync();
        }

        using (var context = CreateDbContext(_tenantA, dbName))
        {
            var movSalva = await context.MovimentacoesEstoque.FirstAsync(m => m.Id == movimentacaoId);

            // Simula tentativa de exclusão indevida no ledger
            context.MovimentacoesEstoque.Remove(movSalva);

            var act = async () => await context.SaveChangesAsync();

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*ledger estritamente imutável (append-only)*");
        }
    }

    [Fact]
    public async Task InclusaoEntidade_ComTenantDivergenteDoContexto_DeveLancarExcecaoDeSeguranca()
    {
        var dbName = Guid.NewGuid().ToString();

        using (var context = CreateDbContext(_tenantA, dbName))
        {
            // Tentativa de gravar produto com tenant B estando em contexto tenant A
            var produtoSpoofed = new Produto(
                id: Guid.NewGuid(),
                restauranteId: _tenantB,
                nome: "Produto Malicioso",
                descricao: "Tentativa de cross-tenant",
                preco: 99m
            );

            await context.Produtos.AddAsync(produtoSpoofed);

            var act = async () => await context.SaveChangesAsync();

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*VIOLAÇÃO DE SEGURANÇA: Tentativa de persistir entidade com RestauranteId*");
        }
    }
}
