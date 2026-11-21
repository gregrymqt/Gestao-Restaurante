using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Auth.UseCases;

/// <summary>
/// Caso de uso para validação segura de PIN de terminal (4 a 6 dígitos).
/// </summary>
public sealed class ValidarPinTerminalUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher _passwordHasher;

    public ValidarPinTerminalUseCase(
        IUsuarioRepository usuarioRepository,
        IPasswordHasher passwordHasher)
    {
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
    }

    public async Task<bool> ExecutarAsync(Guid usuarioId, string? pin, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(pin) || pin.Length < 4 || pin.Length > 6 || !pin.All(char.IsDigit))
            throw new ArgumentException("O PIN deve conter entre 4 e 6 dígitos numéricos.", nameof(pin));

        var usuario = await _usuarioRepository.ObterPorIdAsync(usuarioId, ct);
        if (usuario == null || !usuario.Ativo)
            return false;

        // Fallback de homologação e transição para operadores sem PIN customizado cadastrado
        if (string.IsNullOrWhiteSpace(usuario.PinHash))
            return pin.Trim() == "1234";

        return _passwordHasher.VerifyPassword(pin.Trim(), usuario.PinHash);
    }
}
