using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Movimentação financeira avulsa no caixa operacional (suprimento ou sangria de dinheiro em espécie).
/// </summary>
public sealed class MovimentacaoCaixa : IRestauranteEntity
{
    public const string TipoSuprimento = "SUPRIMENTO";
    public const string TipoSangria = "SANGRIA";

    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid FechamentoCaixaId { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string Tipo { get; private set; } = string.Empty;
    public decimal Valor { get; private set; }
    public string Motivo { get; private set; } = string.Empty;
    public DateTimeOffset DataHora { get; private set; } = DateTimeOffset.UtcNow;

    private MovimentacaoCaixa() { }

    public MovimentacaoCaixa(
        Guid id,
        Guid restauranteId,
        Guid fechamentoCaixaId,
        Guid usuarioId,
        string tipo,
        decimal valor,
        string motivo,
        DateTimeOffset? dataHora = null)
    {
        if (fechamentoCaixaId == Guid.Empty)
            throw new ArgumentException("O identificador do fechamento de caixa é obrigatório.", nameof(fechamentoCaixaId));

        if (usuarioId == Guid.Empty)
            throw new ArgumentException("O identificador do usuário responsável é obrigatório.", nameof(usuarioId));

        if (string.IsNullOrWhiteSpace(tipo))
            throw new ArgumentException("O tipo de movimentação é obrigatório.", nameof(tipo));

        var tipoNormalizado = tipo.Trim().ToUpperInvariant();
        if (tipoNormalizado != TipoSuprimento && tipoNormalizado != TipoSangria)
            throw new ArgumentException($"Tipo de movimentação inválido: '{tipo}'. Esperado '{TipoSuprimento}' ou '{TipoSangria}'.", nameof(tipo));

        if (valor <= 0m)
            throw new ArgumentException("O valor da movimentação deve ser estritamente maior que zero.", nameof(valor));

        if (string.IsNullOrWhiteSpace(motivo))
            throw new ArgumentException("O motivo da movimentação é obrigatório.", nameof(motivo));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        FechamentoCaixaId = fechamentoCaixaId;
        UsuarioId = usuarioId;
        Tipo = tipoNormalizado;
        Valor = valor;
        Motivo = motivo.Trim();
        DataHora = dataHora ?? DateTimeOffset.UtcNow;
    }
}
