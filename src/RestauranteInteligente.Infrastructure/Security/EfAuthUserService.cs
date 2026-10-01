using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Persistence;

namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Provedor de autenticação de usuários baseado em persistência real via EF Core (PostgreSQL).
/// Utiliza IgnoreQueryFilters() no login inicial para localizar o usuário pelo e-mail
/// antes da emissão de tokens JWT e do estabelecimento de contexto do inquilino.
/// </summary>
public sealed class EfAuthUserService : IAuthUserService
{
    private readonly AppDbContext _dbContext;

    public EfAuthUserService(AppDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _dbContext.Usuarios
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.Ativo, ct);

        if (user == null)
            return null;

        return new UserAccount(
            UserId: user.Id,
            RestauranteId: user.RestauranteId,
            Nome: user.Nome,
            Email: user.Email,
            PasswordHash: user.SenhaHash,
            Role: user.Role
        );
    }
}
