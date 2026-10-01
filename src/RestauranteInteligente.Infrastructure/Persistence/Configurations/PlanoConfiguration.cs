using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class PlanoConfiguration : IEntityTypeConfiguration<Plano>
{
    public void Configure(EntityTypeBuilder<Plano> builder)
    {
        builder.ToTable("Planos");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nome)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(p => p.Descricao)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(p => p.PrecoMensal)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(p => p.PossuiModuloIa)
            .IsRequired();

        builder.Property(p => p.Ativo)
            .IsRequired();

        builder.Property(p => p.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.HasIndex(p => p.Nome)
            .IsUnique()
            .HasDatabaseName("UQ_Planos_Nome");
    }
}
