using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class DadosClimaticosConfiguration : IEntityTypeConfiguration<DadosClimaticos>
{
    public void Configure(EntityTypeBuilder<DadosClimaticos> builder)
    {
        builder.ToTable("DadosClimaticos");

        builder.HasKey(dc => dc.Id);

        builder.Property(dc => dc.RestauranteId)
            .IsRequired();

        builder.Property(dc => dc.Data)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(dc => dc.Temperatura)
            .HasColumnType("numeric(5,2)")
            .IsRequired();

        builder.Property(dc => dc.Umidade)
            .HasColumnType("numeric(5,2)")
            .IsRequired();

        builder.Property(dc => dc.Precipitacao)
            .HasColumnType("numeric(6,2)")
            .IsRequired();

        builder.Property(dc => dc.TipoDado)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(dc => dc.ConsultadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(dc => dc.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(dc => new { dc.RestauranteId, dc.Data })
            .IsUnique()
            .HasDatabaseName("UQ_DadosClimaticos_Restaurante_Data");
    }
}
