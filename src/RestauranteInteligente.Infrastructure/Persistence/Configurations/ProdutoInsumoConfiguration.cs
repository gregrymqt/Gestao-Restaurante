using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class ProdutoInsumoConfiguration : IEntityTypeConfiguration<ProdutoInsumo>
{
    public void Configure(EntityTypeBuilder<ProdutoInsumo> builder)
    {
        builder.ToTable("ProdutosInsumos");

        builder.HasKey(pi => pi.Id);

        builder.Property(pi => pi.RestauranteId)
            .IsRequired();

        builder.Property(pi => pi.ProdutoId)
            .IsRequired();

        builder.Property(pi => pi.InsumoId)
            .IsRequired();

        builder.Property(pi => pi.QuantidadeInsumo)
            .HasColumnName("Quantidade")
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.HasOne(pi => pi.Produto)
            .WithMany(p => p.FichaTecnica)
            .HasForeignKey(pi => pi.ProdutoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pi => pi.Insumo)
            .WithMany()
            .HasForeignKey(pi => pi.InsumoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(pi => new { pi.ProdutoId, pi.InsumoId })
            .IsUnique()
            .HasDatabaseName("UQ_ProdutosInsumos_Composicao");

        builder.HasIndex(pi => pi.InsumoId)
            .HasDatabaseName("IX_ProdutosInsumos_InsumoId");

        builder.HasIndex(pi => pi.RestauranteId)
            .HasDatabaseName("IX_ProdutosInsumos_RestauranteId");
    }
}
