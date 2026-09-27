using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class PrevisaoConfiguration : IEntityTypeConfiguration<Previsao>
{
    public void Configure(EntityTypeBuilder<Previsao> builder)
    {
        builder.ToTable("Previsoes");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.RestauranteId)
            .IsRequired();

        builder.Property(p => p.ProdutoId)
            .IsRequired();

        builder.Property(p => p.DataPrevisao)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(p => p.DataReferencia)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(p => p.QuantidadePrevista)
            .HasColumnName("DemandaPrevista")
            .HasColumnType("numeric(10,2)")
            .IsRequired();

        builder.Property(p => p.ModeloVersao)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(p => p.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Produto)
            .WithMany()
            .HasForeignKey(p => p.ProdutoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.RestauranteId, p.DataPrevisao, p.ProdutoId })
            .IsUnique()
            .HasDatabaseName("UQ_Previsoes_Restaurante_Data_Produto");

        builder.HasIndex(p => new { p.RestauranteId, p.DataPrevisao })
            .HasDatabaseName("IX_Previsoes_Restaurante_Data");
    }
}
