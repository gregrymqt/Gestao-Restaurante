using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class VendaConfiguration : IEntityTypeConfiguration<Venda>
{
    public void Configure(EntityTypeBuilder<Venda> builder)
    {
        builder.ToTable("Vendas");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.RestauranteId)
            .IsRequired();

        builder.Property(v => v.FechamentoCaixaId)
            .IsRequired(false);

        builder.Property(v => v.DataHora)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(v => v.ValorTotal)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(v => v.FormaPagamento)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(v => v.Status)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(v => v.CriadoEm)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.HasOne<Restaurante>()
            .WithMany()
            .HasForeignKey(v => v.RestauranteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<FechamentoCaixa>()
            .WithMany()
            .HasForeignKey(v => v.FechamentoCaixaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(v => v.Itens)
            .WithOne(i => i.Venda)
            .HasForeignKey(i => i.VendaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => new { v.RestauranteId, v.DataHora })
            .HasDatabaseName("IX_Vendas_Restaurante_DataHora");

        builder.HasIndex(v => v.FechamentoCaixaId)
            .HasDatabaseName("IX_Vendas_FechamentoCaixaId");
    }
}
