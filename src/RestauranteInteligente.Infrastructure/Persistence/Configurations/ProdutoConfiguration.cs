using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class ProdutoConfiguration : IEntityTypeConfiguration<Produto>
{
    public void Configure(EntityTypeBuilder<Produto> builder)
    {
        builder.ToTable("Produtos");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.RestauranteId)
            .IsRequired();

        builder.Property(p => p.Nome)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(p => p.Descricao)
            .HasColumnType("text")
            .IsRequired(false);

        builder.Property(p => p.Preco)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(p => p.Ativo)
            .IsRequired();

        builder.Property(p => p.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        // Concorrência Otimista nativa do PostgreSQL via xmin
        builder.Property(p => p.Version).IsRowVersion();

        builder.HasIndex(p => new { p.RestauranteId, p.Nome });
    }
}
