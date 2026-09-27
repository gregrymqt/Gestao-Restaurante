using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class FechamentoCaixaConfiguration : IEntityTypeConfiguration<FechamentoCaixa>
{
    public void Configure(EntityTypeBuilder<FechamentoCaixa> builder)
    {
        builder.ToTable("FechamentosCaixa");

        builder.HasKey(fc => fc.Id);

        builder.Property(fc => fc.RestauranteId)
            .IsRequired();

        builder.Property(fc => fc.UsuarioId)
            .IsRequired();

        builder.Property(fc => fc.DataAbertura)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(fc => fc.DataFechamento)
            .HasColumnType("timestamptz")
            .IsRequired(false);

        builder.Property(fc => fc.TotalVendas)
            .HasColumnName("ValorTotalVendas")
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(fc => fc.QuantidadeVendas)
            .IsRequired();

        builder.Property(fc => fc.Status)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(fc => fc.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(fc => fc.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(fc => fc.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(fc => fc.RestauranteId)
            .HasFilter("\"Status\" = 'ABERTO'")
            .IsUnique()
            .HasDatabaseName("IX_FechamentosCaixa_Ativo");

        builder.HasIndex(fc => fc.UsuarioId)
            .HasDatabaseName("IX_FechamentosCaixa_UsuarioId");
    }
}
