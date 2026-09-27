using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class InsumoConfiguration : IEntityTypeConfiguration<Insumo>
{
    public void Configure(EntityTypeBuilder<Insumo> builder)
    {
        builder.ToTable("Insumos");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.RestauranteId)
            .IsRequired();

        builder.Property(i => i.Nome)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(i => i.UnidadeMedida)
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(i => i.QuantidadeEstoque)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(i => i.EstoqueMinimo)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(i => i.CustoUnitario)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(i => i.Ativo)
            .IsRequired();

        builder.Property(i => i.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        // Concorrência Otimista nativa do PostgreSQL via xmin
        builder.Property(i => i.Version).IsRowVersion();

        builder.HasIndex(i => new { i.RestauranteId, i.Nome })
            .IsUnique();
    }
}
