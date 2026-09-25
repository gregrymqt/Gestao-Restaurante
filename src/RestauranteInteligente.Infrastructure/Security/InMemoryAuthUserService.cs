using System.Collections.Concurrent;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Provedor seguro em memória de contas de usuário e seus respectivos inquilinos legítimos.
/// Assegura que credenciais possuam hashes criptográficos e impede injeção arbitrária de RestauranteId.
/// </summary>
public sealed class InMemoryAuthUserService : IAuthUserService
{
    private readonly ConcurrentDictionary<string, UserAccount> _users = new(StringComparer.OrdinalIgnoreCase);

    public InMemoryAuthUserService(IPasswordHasher passwordHasher)
    {
        // Contas de teste com senhas hasheadas e inquilinos estritamente vinculados
        var tenantA = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        var tenantB = Guid.Parse("bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee");

        RegisterUser(new UserAccount(
            UserId: Guid.Parse("33333333-3333-3333-3333-333333333333"),
            RestauranteId: tenantA,
            Email: "gerente@restaurante.com",
            PasswordHash: passwordHasher.HashPassword("Password@Segura2026!"),
            Role: "Manager"
        ));

        RegisterUser(new UserAccount(
            UserId: Guid.Parse("44444444-4444-4444-4444-444444444444"),
            RestauranteId: tenantA,
            Email: "admin@restaurante.com",
            PasswordHash: passwordHasher.HashPassword("AdminPassword@2026!"),
            Role: "Admin"
        ));

        RegisterUser(new UserAccount(
            UserId: Guid.Parse("55555555-5555-5555-5555-555555555555"),
            RestauranteId: tenantB,
            Email: "gerente@outro-restaurante.com",
            PasswordHash: passwordHasher.HashPassword("TenantB@Segura2026!"),
            Role: "Manager"
        ));
    }

    public Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return Task.FromResult<UserAccount?>(null);

        _users.TryGetValue(email.Trim(), out var user);
        return Task.FromResult(user);
    }

    public void RegisterUser(UserAccount account)
    {
        _users[account.Email] = account;
    }
}
