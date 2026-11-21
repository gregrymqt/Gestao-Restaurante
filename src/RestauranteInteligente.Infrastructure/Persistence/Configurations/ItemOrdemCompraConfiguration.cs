using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class ItemOrdemCompraConfiguration : IEntityTypeConfiguration<ItemOrdemCompra>
{
    public void Configure(EntityTypeBuilder<ItemOrdemCompra> builder)
    {
        builder.ToTable("ItensOrdemCompra");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.RestauranteId)
            .IsRequired();

        builder.Property(i => i.OrdemCompraId)
            .IsRequired();

        builder.Property(i => i.InsumoId)
            .IsRequired();

        builder.Property(i => i.Quantidade)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(i => i.PrecoUnitarioEstimado)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(i => i.SubtotalEstimado)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(i => i.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.OrdemCompra)
            .WithMany(o => o.Itens)
            .HasForeignKey(i => i.OrdemCompraId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Insumo)
            .WithMany()
            .HasForeignKey(i => i.InsumoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.OrdemCompraId)
            .HasDatabaseName("IX_ItensOrdemCompra_OrdemCompraId");

        builder.HasIndex(i => i.InsumoId)
            .HasDatabaseName("IX_ItensOrdemCompra_InsumoId");

        builder.HasIndex(i => i.RestauranteId)
            .HasDatabaseName("IX_ItensOrdemCompra_RestauranteId");
    }
}
