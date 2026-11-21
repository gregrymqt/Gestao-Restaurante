using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class MovimentacaoCaixaConfiguration : IEntityTypeConfiguration<MovimentacaoCaixa>
{
    public void Configure(EntityTypeBuilder<MovimentacaoCaixa> builder)
    {
        builder.ToTable("MovimentacoesCaixa");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.RestauranteId)
            .IsRequired();

        builder.Property(m => m.FechamentoCaixaId)
            .IsRequired();

        builder.Property(m => m.UsuarioId)
            .IsRequired();

        builder.Property(m => m.Tipo)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(m => m.Valor)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(m => m.Motivo)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(m => m.DataHora)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(m => m.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<FechamentoCaixa>()
            .WithMany()
            .HasForeignKey(m => m.FechamentoCaixaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(m => m.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.RestauranteId)
            .HasDatabaseName("IX_MovimentacoesCaixa_RestauranteId");

        builder.HasIndex(m => m.FechamentoCaixaId)
            .HasDatabaseName("IX_MovimentacoesCaixa_FechamentoCaixaId");

        builder.HasIndex(m => m.DataHora)
            .HasDatabaseName("IX_MovimentacoesCaixa_DataHora");
    }
}
