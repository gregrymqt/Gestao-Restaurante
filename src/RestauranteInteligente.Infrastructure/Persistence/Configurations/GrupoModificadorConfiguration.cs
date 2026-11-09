using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class GrupoModificadorConfiguration : IEntityTypeConfiguration<GrupoModificador>
{
    public void Configure(EntityTypeBuilder<GrupoModificador> builder)
    {
        builder.ToTable("GruposModificadores");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.RestauranteId)
            .IsRequired();

        builder.Property(g => g.Nome)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(g => g.Descricao)
            .HasMaxLength(255);

        builder.Property(g => g.Obrigatorio)
            .IsRequired();

        builder.Property(g => g.MinimoSelecoes)
            .IsRequired();

        builder.Property(g => g.MaximoSelecoes)
            .IsRequired();

        builder.Property(g => g.Ativo)
            .IsRequired();

        builder.Property(g => g.CriadoEm)
            .IsRequired();

        builder.HasMany(g => g.Opcoes)
            .WithOne(o => o.GrupoModificador)
            .HasForeignKey(o => o.GrupoModificadorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.ProdutosVinculados)
            .WithOne(p => p.GrupoModificador)
            .HasForeignKey(p => p.GrupoModificadorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(g => g.RestauranteId)
            .HasDatabaseName("IX_GruposModificadores_RestauranteId");
    }
}
