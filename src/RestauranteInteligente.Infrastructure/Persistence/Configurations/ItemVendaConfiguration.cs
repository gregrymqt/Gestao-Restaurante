using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class ItemVendaConfiguration : IEntityTypeConfiguration<ItemVenda>
{
    public void Configure(EntityTypeBuilder<ItemVenda> builder)
    {
        builder.ToTable("ItensVenda");

        builder.HasKey(iv => iv.Id);

        builder.Property(iv => iv.RestauranteId)
            .IsRequired();

        builder.Property(iv => iv.VendaId)
            .IsRequired();

        builder.Property(iv => iv.ProdutoId)
            .IsRequired();

        builder.Property(iv => iv.Quantidade)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(iv => iv.PrecoUnitario)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(iv => iv.Subtotal)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.HasOne(iv => iv.Venda)
            .WithMany(v => v.Itens)
            .HasForeignKey(iv => iv.VendaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(iv => iv.Produto)
            .WithMany()
            .HasForeignKey(iv => iv.ProdutoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(iv => iv.VendaId)
            .HasDatabaseName("IX_ItensVenda_VendaId");

        builder.HasIndex(iv => iv.ProdutoId)
            .HasDatabaseName("IX_ItensVenda_ProdutoId");

        builder.HasIndex(iv => iv.RestauranteId)
            .HasDatabaseName("IX_ItensVenda_RestauranteId");
    }
}
