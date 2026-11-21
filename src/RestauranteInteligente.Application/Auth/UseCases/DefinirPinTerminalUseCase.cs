using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Auth.UseCases;

/// <summary>
/// Caso de uso para definição ou atualização de PIN de terminal pelo operador ou gestor.
/// </summary>
public sealed class DefinirPinTerminalUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher _passwordHasher;

    public DefinirPinTerminalUseCase(
        IUsuarioRepository usuarioRepository,
        IPasswordHasher passwordHasher)
    {
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
    }

    public async Task ExecutarAsync(Guid usuarioId, string? novoPin, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(novoPin) || novoPin.Length < 4 || novoPin.Length > 6 || !novoPin.All(char.IsDigit))
            throw new ArgumentException("O novo PIN deve conter entre 4 e 6 dígitos numéricos.", nameof(novoPin));

        var usuario = await _usuarioRepository.ObterPorIdAsync(usuarioId, ct);
        if (usuario == null || !usuario.Ativo)
            throw new KeyNotFoundException("Usuário não encontrado ou inativo.");

        var pinHash = _passwordHasher.HashPassword(novoPin.Trim());
        usuario.DefinirPin(pinHash);
        await _usuarioRepository.AtualizarAsync(usuario, ct);
    }
}
