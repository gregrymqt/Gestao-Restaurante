using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class MovimentacaoEstoqueConfiguration : IEntityTypeConfiguration<MovimentacaoEstoque>
{
    public void Configure(EntityTypeBuilder<MovimentacaoEstoque> builder)
    {
        builder.ToTable("MovimentacoesEstoque");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.RestauranteId)
            .IsRequired();

        builder.Property(m => m.InsumoId)
            .IsRequired();

        builder.Property(m => m.Tipo)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(m => m.Origem)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(m => m.Quantidade)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(m => m.DataHora)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(m => m.ReferenciaId)
            .IsRequired(false);

        builder.Property(m => m.Observacao)
            .HasColumnType("text")
            .IsRequired(false);

        builder.HasIndex(m => new { m.RestauranteId, m.InsumoId, m.DataHora })
            .HasDatabaseName("IX_Movimentacoes_Restaurante_Insumo_Data");
    }
}
