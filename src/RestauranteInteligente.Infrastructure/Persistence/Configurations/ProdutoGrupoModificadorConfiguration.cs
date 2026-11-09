using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Configurations;

public sealed class ProdutoGrupoModificadorConfiguration : IEntityTypeConfiguration<ProdutoGrupoModificador>
{
    public void Configure(EntityTypeBuilder<ProdutoGrupoModificador> builder)
    {
        builder.ToTable("ProdutosGruposModificadores");

        builder.HasKey(pg => pg.Id);

        builder.Property(pg => pg.RestauranteId)
            .IsRequired();

        builder.Property(pg => pg.ProdutoId)
            .IsRequired();

        builder.Property(pg => pg.GrupoModificadorId)
            .IsRequired();

        builder.Property(pg => pg.OrdemExibicao)
            .IsRequired();

        builder.HasOne(pg => pg.Produto)
            .WithMany(p => p.GruposModificadores)
            .HasForeignKey(pg => pg.ProdutoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pg => pg.GrupoModificador)
            .WithMany(g => g.ProdutosVinculados)
            .HasForeignKey(pg => pg.GrupoModificadorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(pg => new { pg.ProdutoId, pg.GrupoModificadorId })
            .IsUnique()
            .HasDatabaseName("IX_ProdutosGruposModificadores_Produto_Grupo");

        builder.HasIndex(pg => pg.RestauranteId)
            .HasDatabaseName("IX_ProdutosGruposModificadores_RestauranteId");
    }
}
