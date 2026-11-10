namespace RestauranteInteligente.Domain.Enums;

/// <summary>
/// Constantes de estado operacional do pedido no Painel de Cozinha (KDS).
/// </summary>
public static class StatusPreparoKds
{
    public const string Recebido = "RECEBIDO";
    public const string EmPreparo = "EM_PREPARO";
    public const string Pronto = "PRONTO";
    public const string Entregue = "ENTREGUE";
    public const string Cancelado = "CANCELADO";

    private static readonly HashSet<string> StatusValidos = new(StringComparer.OrdinalIgnoreCase)
    {
        Recebido,
        EmPreparo,
        Pronto,
        Entregue,
        Cancelado
    };

    public static bool IsAtivoNoKds(string? status) =>
        status is Recebido or EmPreparo or Pronto;

    public static string NormalizarEValidar(string status)
    {
        if (string.IsNullOrWhiteSpace(status))
            throw new ArgumentException("O status de preparo KDS é obrigatório.", nameof(status));

        var normalizado = status.Trim().ToUpperInvariant();
        if (!StatusValidos.Contains(normalizado))
            throw new ArgumentException($"Status de preparo KDS inválido: '{status}'. Valores aceitos: RECEBIDO, EM_PREPARO, PRONTO, ENTREGUE.", nameof(status));

        return normalizado;
    }
}
