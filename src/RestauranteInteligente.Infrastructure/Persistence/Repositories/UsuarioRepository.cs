using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Persistence.Repositories;

/// <summary>
/// Implementação EF Core para repositório de Usuários com bypass de filtro de inquilino para validações globais de e-mail.
/// </summary>
public sealed class UsuarioRepository : IUsuarioRepository
{
    private readonly AppDbContext _context;

    public UsuarioRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var normalizedEmail = email.Trim().ToLowerInvariant();

        return await _context.Usuarios
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.Ativo, ct);
    }

    public async Task<bool> ExisteEmailAsync(string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        var normalizedEmail = email.Trim().ToLowerInvariant();

        return await _context.Usuarios
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(u => u.Email == normalizedEmail, ct);
    }

    public async Task AdicionarAsync(Usuario usuario, CancellationToken ct = default)
    {
        if (usuario == null)
            throw new ArgumentNullException(nameof(usuario));

        await _context.Usuarios.AddAsync(usuario, ct);
    }
}
