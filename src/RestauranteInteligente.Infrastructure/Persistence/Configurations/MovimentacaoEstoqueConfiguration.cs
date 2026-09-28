using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;

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
            .HasConversion(
                v => v.ToString().ToUpperInvariant(),
                v => Enum.Parse<TipoMovimentacao>(v, true))
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(m => m.Origem)
            .HasConversion(
                v => v.ToString().ToUpperInvariant(),
                v => Enum.Parse<OrigemMovimentacao>(v, true))
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
