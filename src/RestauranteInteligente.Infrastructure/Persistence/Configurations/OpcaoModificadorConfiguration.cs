using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class OpcaoModificadorConfiguration : IEntityTypeConfiguration<OpcaoModificador>
{
    public void Configure(EntityTypeBuilder<OpcaoModificador> builder)
    {
        builder.ToTable("OpcoesModificadores");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.RestauranteId)
            .IsRequired();

        builder.Property(o => o.GrupoModificadorId)
            .IsRequired();

        builder.Property(o => o.Nome)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(o => o.PrecoAdicional)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(o => o.InsumoId)
            .IsRequired(false);

        builder.Property(o => o.QuantidadeInsumo)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(o => o.TipoAcao)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(o => o.Ativo)
            .IsRequired();

        builder.Property(o => o.CriadoEm)
            .IsRequired();

        builder.HasOne(o => o.Insumo)
            .WithMany()
            .HasForeignKey(o => o.InsumoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(o => o.RestauranteId)
            .HasDatabaseName("IX_OpcoesModificadores_RestauranteId");

        builder.HasIndex(o => o.GrupoModificadorId)
            .HasDatabaseName("IX_OpcoesModificadores_GrupoModificadorId");

        builder.HasIndex(o => o.InsumoId)
            .HasDatabaseName("IX_OpcoesModificadores_InsumoId");
    }
}
