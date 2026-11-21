using RestauranteInteligente.Application.Auth.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Auth.UseCases;

/// <summary>
/// Caso de uso para listar todos os colaboradores e operadores cadastrados de um restaurante.
/// </summary>
public sealed class ListarOperadoresRestauranteUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;

    public ListarOperadoresRestauranteUseCase(IUsuarioRepository usuarioRepository)
    {
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
    }

    public async Task<IReadOnlyList<OperadorResumoDto>> ExecutarAsync(Guid restauranteId, CancellationToken ct = default)
    {
        if (restauranteId == Guid.Empty)
            throw new ArgumentException("O ID do restaurante é obrigatório.", nameof(restauranteId));

        var usuarios = await _usuarioRepository.ListarPorRestauranteAsync(restauranteId, ct);

        return usuarios
            .Select(u => new OperadorResumoDto(
                Id: u.Id,
                Nome: u.Nome,
                Email: u.Email,
                Role: u.Role,
                Iniciais: ExtrairIniciais(u.Nome),
                Ativo: u.Ativo,
                PossuiPin: !string.IsNullOrWhiteSpace(u.PinHash)
            ))
            .ToList();
    }

    private static string ExtrairIniciais(string nome)
    {
        if (string.IsNullOrWhiteSpace(nome))
            return "OP";

        var partes = nome.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (partes.Length == 1)
            return partes[0].Length >= 2 ? partes[0][..2].ToUpperInvariant() : partes[0].ToUpperInvariant();

        return $"{partes[0][0]}{partes[^1][0]}".ToUpperInvariant();
    }
}
