using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Common.Interfaces;

/// <summary>
/// Contrato do contexto de dados do Entity Framework Core com segregação de inquilinos.
/// </summary>
public interface IAppDbContext
{
    DbSet<Restaurante> Restaurantes { get; }
    DbSet<Insumo> Insumos { get; }
    DbSet<Produto> Produtos { get; }
    DbSet<MovimentacaoEstoque> MovimentacoesEstoque { get; }
    DbSet<Usuario> Usuarios { get; }
    DbSet<ProdutoInsumo> ProdutosInsumos { get; }
    DbSet<Venda> Vendas { get; }
    DbSet<ItemVenda> ItensVenda { get; }
    DbSet<FechamentoCaixa> FechamentosCaixa { get; }
    DbSet<DadosClimaticos> DadosClimaticos { get; }
    DbSet<Previsao> Previsoes { get; }

    DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
