namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Catálogo de planos de assinatura do SaaS Restaurante Inteligente.
/// </summary>
public sealed class Plano
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string Descricao { get; private set; } = string.Empty;
    public decimal PrecoMensal { get; private set; }
    public bool PossuiModuloIa { get; private set; }
    public bool Ativo { get; private set; } = true;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    private Plano() { }

    public Plano(
        Guid id,
        string nome,
        string descricao,
        decimal precoMensal,
        bool possuiModuloIa,
        bool ativo = true,
        DateTimeOffset? criadoEm = null)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("O nome do plano é obrigatório.", nameof(nome));

        if (precoMensal < 0m)
            throw new ArgumentException("O preço mensal não pode ser negativo.", nameof(precoMensal));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        Nome = nome.Trim();
        Descricao = descricao.Trim();
        PrecoMensal = precoMensal;
        PossuiModuloIa = possuiModuloIa;
        Ativo = ativo;
        CriadoEm = criadoEm ?? DateTimeOffset.UtcNow;
    }
}
