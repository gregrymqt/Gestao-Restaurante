using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class OrdemCompraConfiguration : IEntityTypeConfiguration<OrdemCompra>
{
    public void Configure(EntityTypeBuilder<OrdemCompra> builder)
    {
        builder.ToTable("OrdensCompra");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.RestauranteId)
            .IsRequired();

        builder.Property(o => o.Protocolo)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(o => o.Status)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(o => o.ValorTotalEstimado)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(o => o.UsuarioId)
            .IsRequired();

        builder.Property(o => o.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(o => o.Fornecedor)
            .HasMaxLength(150)
            .IsRequired(false);

        builder.Property(o => o.Observacao)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(o => o.AtualizadoEm)
            .HasColumnType("timestamptz")
            .IsRequired(false);

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(o => o.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(o => o.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Itens)
            .WithOne(i => i.OrdemCompra)
            .HasForeignKey(i => i.OrdemCompraId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(o => o.Itens)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(o => new { o.RestauranteId, o.Protocolo })
            .IsUnique()
            .HasDatabaseName("IX_OrdensCompra_RestauranteId_Protocolo");

        builder.HasIndex(o => o.CriadoEm)
            .HasDatabaseName("IX_OrdensCompra_CriadoEm");
    }
}
