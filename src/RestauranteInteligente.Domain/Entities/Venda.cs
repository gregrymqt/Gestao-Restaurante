using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Venda comercial registrada e transacionada no restaurante.
/// </summary>
public sealed class Venda : IRestauranteEntity
{
    private readonly List<ItemVenda> _itens = new();

    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid? FechamentoCaixaId { get; private set; }
    public DateTimeOffset DataHora { get; private set; } = DateTimeOffset.UtcNow;
    public string Status { get; private set; } = "CONCLUIDA";
    public string FormaPagamento { get; private set; } = string.Empty;
    public decimal ValorTotal { get; private set; }
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    public IReadOnlyCollection<ItemVenda> Itens => _itens.AsReadOnly();

    private Venda() { }

    public Venda(
        Guid id,
        Guid restauranteId,
        string formaPagamento,
        Guid? fechamentoCaixaId = null,
        DateTimeOffset? dataHora = null,
        string status = "CONCLUIDA",
        DateTimeOffset? criadoEm = null)
    {
        if (string.IsNullOrWhiteSpace(formaPagamento))
            throw new ArgumentException("A forma de pagamento é obrigatória.", nameof(formaPagamento));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        FechamentoCaixaId = fechamentoCaixaId;
        FormaPagamento = formaPagamento.Trim();
        DataHora = dataHora ?? DateTimeOffset.UtcNow;
        Status = string.IsNullOrWhiteSpace(status) ? "CONCLUIDA" : status.Trim().ToUpperInvariant();
        ValorTotal = 0m;
        CriadoEm = criadoEm ?? DateTimeOffset.UtcNow;
    }

    public ItemVenda AdicionarItem(Guid produtoId, decimal quantidade, decimal precoUnitario)
    {
        if (Status == "CANCELADA")
            throw new InvalidOperationException("Não é permitido adicionar itens a uma venda cancelada.");

        var item = new ItemVenda(
            id: Guid.NewGuid(),
            restauranteId: RestauranteId,
            vendaId: Id,
            produtoId: produtoId,
            quantidade: quantidade,
            precoUnitario: precoUnitario
        );

        _itens.Add(item);
        ValorTotal += item.Subtotal;

        return item;
    }

    public void VincularFechamentoCaixa(Guid fechamentoCaixaId)
    {
        if (fechamentoCaixaId == Guid.Empty)
            throw new ArgumentException("O identificador do fechamento de caixa é obrigatório.", nameof(fechamentoCaixaId));

        FechamentoCaixaId = fechamentoCaixaId;
    }

    public void Cancelar(string motivo)
    {
        if (Status == "CANCELADA")
            throw new InvalidOperationException("A venda já se encontra cancelada.");

        Status = "CANCELADA";
    }
}
