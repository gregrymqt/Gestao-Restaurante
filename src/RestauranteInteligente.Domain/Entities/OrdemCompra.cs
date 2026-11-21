using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Ordem de compra de insumos gerada a partir de projeções preditivas ou solicitações manuais.
/// </summary>
public sealed class OrdemCompra : IRestauranteEntity
{
    public const string StatusPendente = "PENDENTE";
    public const string StatusAprovada = "APROVADA";
    public const string StatusCancelada = "CANCELADA";
    public const string StatusRecebida = "RECEBIDA";

    private readonly List<ItemOrdemCompra> _itens = new();

    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public string Protocolo { get; private set; } = string.Empty;
    public string Status { get; private set; } = StatusPendente;
    public decimal ValorTotalEstimado { get; private set; }
    public Guid UsuarioId { get; private set; }
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    public IReadOnlyCollection<ItemOrdemCompra> Itens => _itens.AsReadOnly();

    private OrdemCompra() { }

    public OrdemCompra(
        Guid id,
        Guid restauranteId,
        string protocolo,
        Guid usuarioId,
        DateTimeOffset? criadoEm = null,
        string status = StatusPendente)
    {
        if (string.IsNullOrWhiteSpace(protocolo))
            throw new ArgumentException("O protocolo da ordem de compra é obrigatório.", nameof(protocolo));

        if (usuarioId == Guid.Empty)
            throw new ArgumentException("O identificador do usuário criador é obrigatório.", nameof(usuarioId));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        Protocolo = protocolo.Trim().ToUpperInvariant();
        UsuarioId = usuarioId;
        Status = string.IsNullOrWhiteSpace(status) ? StatusPendente : status.Trim().ToUpperInvariant();
        CriadoEm = criadoEm ?? DateTimeOffset.UtcNow;
        ValorTotalEstimado = 0m;
    }

    public void AdicionarItem(Guid insumoId, decimal quantidade, decimal precoUnitarioEstimado)
    {
        if (Status != StatusPendente)
            throw new InvalidOperationException("Não é permitido adicionar itens a uma ordem de compra que não esteja pendente.");

        var item = new ItemOrdemCompra(Guid.NewGuid(), RestauranteId, Id, insumoId, quantidade, precoUnitarioEstimado);
        _itens.Add(item);
        RecalcularTotal();
    }

    public void AtualizarStatus(string novoStatus)
    {
        if (string.IsNullOrWhiteSpace(novoStatus))
            throw new ArgumentException("O novo status não pode ser vazio.", nameof(novoStatus));

        var statusNormalizado = novoStatus.Trim().ToUpperInvariant();
        Status = statusNormalizado;
    }

    private void RecalcularTotal()
    {
        ValorTotalEstimado = _itens.Sum(i => i.SubtotalEstimado);
    }
}
