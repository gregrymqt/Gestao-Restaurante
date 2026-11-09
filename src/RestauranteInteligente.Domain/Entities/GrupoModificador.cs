using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Grupo de modificadores associável a produtos (ex: "Ponto da Carne", "Adicionais", "Remoções").
/// Segregado por RestauranteId em conformidade com as diretrizes multi-tenant.
/// </summary>
public sealed class GrupoModificador : IRestauranteEntity
{
    private readonly List<OpcaoModificador> _opcoes = new();
    private readonly List<ProdutoGrupoModificador> _produtosVinculados = new();

    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string? Descricao { get; private set; }
    public bool Obrigatorio { get; private set; }
    public int MinimoSelecoes { get; private set; }
    public int MaximoSelecoes { get; private set; }
    public bool Ativo { get; private set; } = true;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    public IReadOnlyCollection<OpcaoModificador> Opcoes => _opcoes.AsReadOnly();
    public IReadOnlyCollection<ProdutoGrupoModificador> ProdutosVinculados => _produtosVinculados.AsReadOnly();

    private GrupoModificador() { }

    public GrupoModificador(
        Guid id,
        Guid restauranteId,
        string nome,
        string? descricao = null,
        bool obrigatorio = false,
        int minimoSelecoes = 0,
        int maximoSelecoes = 1,
        bool ativo = true)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("O nome do grupo de modificadores é obrigatório.", nameof(nome));

        if (minimoSelecoes < 0)
            throw new ArgumentException("O mínimo de seleções não pode ser negativo.", nameof(minimoSelecoes));

        if (maximoSelecoes < minimoSelecoes)
            throw new ArgumentException("O máximo de seleções não pode ser menor que o mínimo.", nameof(maximoSelecoes));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        Nome = nome.Trim();
        Descricao = descricao?.Trim();
        Obrigatorio = obrigatorio;
        MinimoSelecoes = minimoSelecoes;
        MaximoSelecoes = maximoSelecoes;
        Ativo = ativo;
        CriadoEm = DateTimeOffset.UtcNow;
    }

    public OpcaoModificador AdicionarOpcao(
        string nome,
        decimal precoAdicional,
        Enums.TipoAcaoModificador tipoAcao,
        Guid? insumoId = null,
        decimal quantidadeInsumo = 0m,
        Guid? id = null)
    {
        var opcao = new OpcaoModificador(
            id: id ?? Guid.NewGuid(),
            restauranteId: RestauranteId,
            grupoModificadorId: Id,
            nome: nome,
            precoAdicional: precoAdicional,
            tipoAcao: tipoAcao,
            insumoId: insumoId,
            quantidadeInsumo: quantidadeInsumo
        );

        _opcoes.Add(opcao);
        return opcao;
    }

    public void Desativar() => Ativo = false;
    public void Ativar() => Ativo = true;
}
