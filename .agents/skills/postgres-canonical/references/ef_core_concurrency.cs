// ==============================================================================
// Manual Canónico de Engenharia de Dados: PostgreSQL 16
// Implementação Canônica em C# (.NET 8/9 EF Core)
// Baixa de Insumos com Bloqueio Pessimista Anti-Deadlock e Concorrência Otimista (xmin)
// ==============================================================================

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace RestauranteInteligente.Infrastructure.Persistence;

#region Enumerações e Entidades de Domínio

public enum TipoMovimentacao
{
    Entrada,
    Saida,
    Ajuste
}

public enum OrigemMovimentacao
{
    Venda,
    Compra,
    Inventario,
    Descarte
}

public interface IRestauranteEntity
{
    Guid RestauranteId { get; set; }
}

public class Insumo : IRestauranteEntity
{
    public Guid Id { get; set; }
    public Guid RestauranteId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string UnidadeMedida { get; set; } = string.Empty;
    public decimal QuantidadeEstoque { get; set; }
    public decimal EstoqueMinimo { get; set; }
    public decimal CustoUnitario { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTimeOffset CriadoEm { get; set; } = DateTimeOffset.UtcNow;
    public uint Xmin { get; set; } // Token de concorrência PostgreSQL
}

public class MovimentacaoEstoque : IRestauranteEntity
{
    public Guid Id { get; set; }
    public Guid RestauranteId { get; set; }
    public Guid InsumoId { get; set; }
    public TipoMovimentacao Tipo { get; set; }
    public decimal Quantidade { get; set; }
    public DateTimeOffset DataHora { get; set; } = DateTimeOffset.UtcNow;
    public OrigemMovimentacao Origem { get; set; }
    public Guid? ReferenciaId { get; set; }
    public string? Observacao { get; set; }
}

public class ProdutoInsumo
{
    public Guid Id { get; set; }
    public Guid ProdutoId { get; set; }
    public Guid InsumoId { get; set; }
    public decimal Quantidade { get; set; }
}

public class ItemVenda
{
    public Guid Id { get; set; }
    public Guid VendaId { get; set; }
    public Guid ProdutoId { get; set; }
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public List<ProdutoInsumo> FichaTecnica { get; set; } = new();
}

public class Venda : IRestauranteEntity
{
    public Guid Id { get; set; }
    public Guid RestauranteId { get; set; }
    public Guid FechamentoCaixaId { get; set; }
    public DateTimeOffset DataHora { get; set; } = DateTimeOffset.UtcNow;
    public decimal ValorTotal { get; set; }
    public string FormaPagamento { get; set; } = string.Empty;
    public List<ItemVenda> Itens { get; set; } = new();
}

public class EstoqueInsuficienteException : Exception
{
    public EstoqueInsuficienteException(string message) : base(message) { }
}

#endregion

#region Configurações de Mapeamento EF Core (EntityTypeConfiguration)

public class InsumoConfiguration : IEntityTypeConfiguration<Insumo>
{
    public void Configure(EntityTypeBuilder<Insumo> builder)
    {
        builder.ToTable("Insumos");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Nome).HasMaxLength(150).IsRequired();
        builder.Property(x => x.UnidadeMedida).HasMaxLength(10).IsRequired();
        builder.Property(x => x.QuantidadeEstoque).HasPrecision(18, 4);
        builder.Property(x => x.EstoqueMinimo).HasPrecision(18, 4);
        builder.Property(x => x.CustoUnitario).HasPrecision(18, 2);

        // Mapeamento nativo de concorrência otimista via PostgreSQL xmin
        builder.Property(x => x.Xmin)
               .HasColumnName("xmin")
               .HasColumnType("xid")
               .ValueGeneratedOnAddOrUpdate()
               .IsConcurrencyToken();

        builder.HasIndex(x => new { x.RestauranteId, x.Nome }).IsUnique();
        builder.HasIndex(x => new { x.RestauranteId, x.QuantidadeEstoque, x.EstoqueMinimo });
    }
}

public class MovimentacaoEstoqueConfiguration : IEntityTypeConfiguration<MovimentacaoEstoque>
{
    public void Configure(EntityTypeBuilder<MovimentacaoEstoque> builder)
    {
        builder.ToTable("MovimentacoesEstoque");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Tipo).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Origem).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.Quantidade).HasPrecision(18, 4);

        builder.HasIndex(x => new { x.RestauranteId, x.InsumoId, x.DataHora });
    }
}

#endregion

#region Serviço Canônico de Baixa Anti-Deadlock

public interface IEstoqueBaixaService
{
    Task ProcessarBaixaEstoqueVendaAsync(Venda venda, CancellationToken cancellationToken = default);
}

public class EstoqueBaixaService : IEstoqueBaixaService
{
    private readonly DbContext _context;

    public EstoqueBaixaService(DbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Executa a baixa atômica de insumos prevenindo deadlocks via ordenação ascendente (InsumoId ASC)
    /// e garantindo o lançamento imutável no ledger MovimentacoesEstoque.
    /// </summary>
    public async Task ProcessarBaixaEstoqueVendaAsync(Venda venda, CancellationToken cancellationToken = default)
    {
        // 1. Expandir insumos a partir da Ficha Técnica (BOM) e consolidar os consumos totais por insumo
        var insumosNecessarios = venda.Itens
            .SelectMany(item => item.FichaTecnica.Select(pi => new
            {
                pi.InsumoId,
                QuantidadeTotal = pi.Quantidade * item.Quantidade
            }))
            .GroupBy(x => x.InsumoId)
            .Select(g => new { InsumoId = g.Key, Quantidade = g.Sum(x => x.QuantidadeTotal) })
            .OrderBy(x => x.InsumoId) // REGRA MANDATÓRIA ANTI-DEADLOCK: Ordenação determinística ascendente
            .ToList();

        if (!insumosNecessarios.Any())
            return;

        var insumoIds = insumosNecessarios.Select(x => x.InsumoId).ToArray();

        // 2. Transação explícita com bloqueio pessimista ordenado das tuplas
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Bloqueio pessimista estrito via PostgreSQL 'FOR UPDATE' na mesma ordem ordenada
            var insumosDb = await _context.Set<Insumo>()
                .FromSqlRaw("SELECT * FROM \"Insumos\" WHERE \"Id\" = ANY({0}) ORDER BY \"Id\" FOR UPDATE", (object)insumoIds)
                .ToListAsync(cancellationToken);

            foreach (var item in insumosNecessarios)
            {
                var insumo = insumosDb.FirstOrDefault(i => i.Id == item.InsumoId);
                if (insumo == null)
                {
                    throw new InvalidOperationException($"Insumo com ID '{item.InsumoId}' não encontrado para baixa de estoque.");
                }

                if (insumo.QuantidadeEstoque < item.Quantidade)
                {
                    throw new EstoqueInsuficienteException(
                        $"Insumo '{insumo.Nome}' insuficiente. Estoque disponível: {insumo.QuantidadeEstoque} {insumo.UnidadeMedida}, Requerido: {item.Quantidade} {insumo.UnidadeMedida}.");
                }

                // Atualiza a visão materializada aceleradora de leitura
                insumo.QuantidadeEstoque -= item.Quantidade;

                // Emite lançamento estritamente aditivo (append-only) no livro-razão de auditoria
                _context.Set<MovimentacaoEstoque>().Add(new MovimentacaoEstoque
                {
                    Id = Guid.NewGuid(),
                    RestauranteId = insumo.RestauranteId,
                    InsumoId = insumo.Id,
                    Tipo = TipoMovimentacao.Saida,
                    Quantidade = item.Quantidade,
                    DataHora = DateTimeOffset.UtcNow,
                    Origem = OrigemMovimentacao.Venda,
                    ReferenciaId = venda.Id,
                    Observacao = $"Baixa automática referente à Venda {venda.Id}"
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

#endregion
