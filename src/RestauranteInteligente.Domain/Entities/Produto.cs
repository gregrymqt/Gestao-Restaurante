using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Produto comercializado pelo restaurante com precificação monetária (numeric 18,2).
/// </summary>
public sealed class Produto : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string? Descricao { get; private set; }
    public decimal Preco { get; private set; }
    public bool Ativo { get; private set; } = true;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;
    public uint Version { get; private set; } // Token de concorrência PostgreSQL (xmin)

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
}
