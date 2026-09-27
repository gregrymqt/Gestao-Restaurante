using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Produto comercializado pelo restaurante com precificação monetária (numeric 18,2) e ficha técnica associada.
/// </summary>
public sealed class Produto : IRestauranteEntity
{
    private readonly List<ProdutoInsumo> _fichaTecnica = new();

    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string? Descricao { get; private set; }
    public decimal Preco { get; private set; }
    public bool Ativo { get; private set; } = true;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;
    public uint Version { get; private set; } // Token de concorrência PostgreSQL (xmin)

    public IReadOnlyCollection<ProdutoInsumo> FichaTecnica => _fichaTecnica.AsReadOnly();

    private Produto() { }

    public Produto(Guid id, Guid restauranteId, string nome, string? descricao, decimal preco)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("O nome do produto é obrigatório.", nameof(nome));

        if (preco < 0m)
            throw new ArgumentException("O preço não pode ser negativo.", nameof(preco));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        Nome = nome.Trim();
        Descricao = descricao?.Trim();
        Preco = preco;
        Ativo = true;
        CriadoEm = DateTimeOffset.UtcNow;
    }

    public void AtualizarPreco(decimal novoPreco)
    {
        if (novoPreco < 0m)
            throw new ArgumentException("O preço não pode ser negativo.", nameof(novoPreco));

        Preco = novoPreco;
    }

    public void Desativar()
    {
        Ativo = false;
    }

    public void Ativar()
    {
        Ativo = true;
    }

    public ProdutoInsumo AdicionarInsumo(Guid insumoId, decimal quantidade)
    {
        if (insumoId == Guid.Empty)
            throw new ArgumentException("O identificador do insumo é obrigatório.", nameof(insumoId));

        if (quantidade <= 0m)
            throw new ArgumentException("A quantidade consumida deve ser maior que zero.", nameof(quantidade));

        var itemBOM = new ProdutoInsumo(
            id: Guid.NewGuid(),
            restauranteId: RestauranteId,
            produtoId: Id,
            insumoId: insumoId,
            quantidadeInsumo: quantidade
        );

        _fichaTecnica.Add(itemBOM);
        return itemBOM;
    }
}
