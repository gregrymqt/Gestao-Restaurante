using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Associação N:N entre Produto e GrupoModificador com ordem determinística de exibição no PDV.
/// </summary>
public sealed class ProdutoGrupoModificador : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid ProdutoId { get; private set; }
    public Guid GrupoModificadorId { get; private set; }
    public int OrdemExibicao { get; private set; }

    // Navegações de Domínio / EF Core
    public Produto? Produto { get; private set; }
    public GrupoModificador? GrupoModificador { get; private set; }

    private ProdutoGrupoModificador() { }

    public ProdutoGrupoModificador(
        Guid id,
        Guid restauranteId,
        Guid produtoId,
        Guid grupoModificadorId,
        int ordemExibicao = 0)
    {
        if (produtoId == Guid.Empty)
            throw new ArgumentException("O identificador do produto é obrigatório.", nameof(produtoId));

        if (grupoModificadorId == Guid.Empty)
            throw new ArgumentException("O identificador do grupo de modificadores é obrigatório.", nameof(grupoModificadorId));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        ProdutoId = produtoId;
        GrupoModificadorId = grupoModificadorId;
        OrdemExibicao = ordemExibicao;
    }
}
