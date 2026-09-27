namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Inquilino central (Tenant raiz) do sistema Restaurante Inteligente.
/// </summary>
public sealed class Restaurante
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string Cnpj { get; private set; } = string.Empty;
    public string Cidade { get; private set; } = string.Empty;
    public string Estado { get; private set; } = string.Empty;
    public decimal Latitude { get; private set; }
    public decimal Longitude { get; private set; }
    public bool Ativo { get; private set; } = true;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    private Restaurante() { }

    public Restaurante(Guid id, string nome, string cnpj, string cidade, string estado, decimal latitude, decimal longitude)
    {
        Id = id;
        Nome = nome;
        Cnpj = cnpj;
        Cidade = cidade;
        Estado = estado;
        Latitude = latitude;
        Longitude = longitude;
        Ativo = true;
        CriadoEm = DateTimeOffset.UtcNow;
    }
}
