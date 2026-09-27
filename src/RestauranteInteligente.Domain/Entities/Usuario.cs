using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Usuário autenticado vinculado a um restaurante específico com segregação de inquilino.
/// </summary>
public sealed class Usuario : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string SenhaHash { get; private set; } = string.Empty;
    public string Role { get; private set; } = string.Empty;
    public bool Ativo { get; private set; } = true;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    private Usuario() { }

    public Usuario(
        Guid id,
        Guid restauranteId,
        string nome,
        string email,
        string senhaHash,
        string role,
        bool ativo = true,
        DateTimeOffset? criadoEm = null)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("O nome do usuário é obrigatório.", nameof(nome));

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new ArgumentException("O e-mail informado é inválido.", nameof(email));

        if (string.IsNullOrWhiteSpace(senhaHash))
            throw new ArgumentException("O hash da senha é obrigatório.", nameof(senhaHash));

        if (string.IsNullOrWhiteSpace(role))
            throw new ArgumentException("O papel (role) do usuário é obrigatório.", nameof(role));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        Nome = nome.Trim();
        Email = email.Trim().ToLowerInvariant();
        SenhaHash = senhaHash;
        Role = role.Trim();
        Ativo = ativo;
        CriadoEm = criadoEm ?? DateTimeOffset.UtcNow;
    }

    public void AtualizarSenha(string novaSenhaHash)
    {
        if (string.IsNullOrWhiteSpace(novaSenhaHash))
            throw new ArgumentException("O novo hash da senha é obrigatório.", nameof(novaSenhaHash));

        SenhaHash = novaSenhaHash;
    }

    public void AtualizarPerfil(string nome, string role)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("O nome do usuário é obrigatório.", nameof(nome));

        if (string.IsNullOrWhiteSpace(role))
            throw new ArgumentException("O papel (role) é obrigatório.", nameof(role));

        Nome = nome.Trim();
        Role = role.Trim();
    }

    public void Desativar()
    {
        Ativo = false;
    }

    public void Ativar()
    {
        Ativo = true;
    }
}
