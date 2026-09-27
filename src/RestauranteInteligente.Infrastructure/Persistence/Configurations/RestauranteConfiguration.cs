using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class RestauranteConfiguration : IEntityTypeConfiguration<Restaurante>
{
    public void Configure(EntityTypeBuilder<Restaurante> builder)
    {
        builder.ToTable("Restaurantes");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Nome)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(r => r.Cnpj)
            .HasMaxLength(18)
            .IsRequired();

        builder.HasIndex(r => r.Cnpj)
            .IsUnique();

        builder.Property(r => r.Cidade)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(r => r.Estado)
            .HasMaxLength(2)
            .IsRequired();

        builder.Property(r => r.Latitude)
            .HasColumnType("numeric(10,8)")
            .IsRequired();

        builder.Property(r => r.Longitude)
            .HasColumnType("numeric(11,8)")
            .IsRequired();

        builder.Property(r => r.Ativo)
            .IsRequired();

        builder.Property(r => r.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();
    }
}
