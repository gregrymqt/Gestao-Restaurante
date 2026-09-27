using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.RestauranteId)
            .IsRequired();

        builder.Property(u => u.Nome)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(u => u.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(u => u.SenhaHash)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(u => u.Role)
            .HasColumnName("Perfil")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(u => u.Ativo)
            .IsRequired();

        builder.Property(u => u.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(u => u.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("UQ_Usuarios_Email");

        builder.HasIndex(u => u.RestauranteId)
            .HasDatabaseName("IX_Usuarios_RestauranteId");
    }
}
