using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Opção individual selecionável dentro de um GrupoModificador (ex: "Ao Ponto", "+ Bacon Extra").
/// </summary>
public sealed class OpcaoModificador : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid GrupoModificadorId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public decimal PrecoAdicional { get; private set; }
    public Guid? InsumoId { get; private set; }
    public decimal QuantidadeInsumo { get; private set; }
    public TipoAcaoModificador TipoAcao { get; private set; } = TipoAcaoModificador.Culinario;
    public bool Ativo { get; private set; } = true;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    // Navegações de Domínio / EF Core
    public GrupoModificador? GrupoModificador { get; private set; }
    public Insumo? Insumo { get; private set; }

    private OpcaoModificador() { }

    public OpcaoModificador(
        Guid id,
        Guid restauranteId,
        Guid grupoModificadorId,
        string nome,
        decimal precoAdicional,
        TipoAcaoModificador tipoAcao,
        Guid? insumoId = null,
        decimal quantidadeInsumo = 0m,
        bool ativo = true)
    {
        if (grupoModificadorId == Guid.Empty)
            throw new ArgumentException("O identificador do grupo de modificadores é obrigatório.", nameof(grupoModificadorId));

        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("O nome da opção de modificador é obrigatório.", nameof(nome));

        if (precoAdicional < 0m)
            throw new ArgumentException("O preço adicional não pode ser negativo.", nameof(precoAdicional));

        if (tipoAcao == TipoAcaoModificador.Adicional && insumoId.HasValue && quantidadeInsumo <= 0m)
            throw new ArgumentException("Para adicionais com insumo associado, a quantidade consumida deve ser maior que zero.", nameof(quantidadeInsumo));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        GrupoModificadorId = grupoModificadorId;
        Nome = nome.Trim();
        PrecoAdicional = precoAdicional;
        TipoAcao = tipoAcao;
        InsumoId = insumoId;
        QuantidadeInsumo = quantidadeInsumo;
        Ativo = ativo;
        CriadoEm = DateTimeOffset.UtcNow;
    }

    public void Desativar() => Ativo = false;
    public void Ativar() => Ativo = true;
}
