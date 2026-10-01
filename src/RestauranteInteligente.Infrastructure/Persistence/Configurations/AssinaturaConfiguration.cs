using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class AssinaturaConfiguration : IEntityTypeConfiguration<Assinatura>
{
    public void Configure(EntityTypeBuilder<Assinatura> builder)
    {
        builder.ToTable("Assinaturas");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.RestauranteId)
            .IsRequired();

        builder.Property(a => a.PlanoId)
            .IsRequired(false);

        builder.Property(a => a.Status)
            .HasConversion(
                v => v.ToString().ToUpperInvariant(),
                v => Enum.Parse<StatusAssinatura>(v, true))
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(a => a.DataInicio)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(a => a.DataFimTrial)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(a => a.DataExpiracao)
            .HasColumnType("timestamptz")
            .IsRequired(false);

        builder.Property(a => a.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(a => a.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Plano>()
            .WithMany()
            .HasForeignKey(a => a.PlanoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.RestauranteId)
            .IsUnique()
            .HasDatabaseName("IX_Assinaturas_RestauranteId");

        builder.HasIndex(a => a.PlanoId)
            .HasDatabaseName("IX_Assinaturas_PlanoId");
    }
}
