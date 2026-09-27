using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Matéria-prima / insumo cadastrado para o restaurante com controle de estoque e concorrência otimista (xmin).
/// Quantidades utilizam estritamente decimal (numeric 18,4).
/// </summary>
public sealed class Insumo : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string UnidadeMedida { get; private set; } = string.Empty;
    public decimal QuantidadeEstoque { get; private set; }
    public decimal EstoqueMinimo { get; private set; }
    public decimal CustoUnitario { get; private set; }
    public bool Ativo { get; private set; } = true;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;
    public uint Version { get; private set; } // Token de concorrência PostgreSQL (xmin)

    private Insumo() { }

    public Insumo(Guid id, Guid restauranteId, string nome, string unidadeMedida, decimal estoqueMinimo, decimal custoUnitario)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("O nome do insumo é obrigatório.", nameof(nome));

        if (estoqueMinimo < 0m)
            throw new ArgumentException("O estoque mínimo não pode ser negativo.", nameof(estoqueMinimo));

        if (custoUnitario < 0m)
            throw new ArgumentException("O custo unitário não pode ser negativo.", nameof(custoUnitario));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        Nome = nome.Trim();
        UnidadeMedida = unidadeMedida.Trim().ToUpperInvariant();
        EstoqueMinimo = estoqueMinimo;
        CustoUnitario = custoUnitario;
        QuantidadeEstoque = 0m;
        Ativo = true;
        CriadoEm = DateTimeOffset.UtcNow;
    }

    public void DebitarEstoque(decimal quantidade)
    {
        if (quantidade <= 0m)
            throw new ArgumentException("A quantidade a ser debitada deve ser maior que zero.", nameof(quantidade));

        if (QuantidadeEstoque < quantidade)
            throw new InvalidOperationException($"Estoque insuficiente para o insumo '{Nome}'. Saldo disponível: {QuantidadeEstoque}, solicitado: {quantidade}.");

        QuantidadeEstoque -= quantidade;
    }

    public void CreditarEstoque(decimal quantidade)
    {
        if (quantidade <= 0m)
            throw new ArgumentException("A quantidade a ser creditada deve ser maior que zero.", nameof(quantidade));

        QuantidadeEstoque += quantidade;
    }
}
