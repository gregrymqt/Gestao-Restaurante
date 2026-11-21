using RestauranteInteligente.Application.Auth.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Auth.UseCases;

/// <summary>
/// Caso de uso para cadastrar novo colaborador (Operador de PDV, Atendente ou Gestor) vinculado a um restaurante.
/// </summary>
public sealed class CriarOperadorUseCase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public CriarOperadorUseCase(
        IUsuarioRepository usuarioRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher)
    {
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
    }

    public async Task<OperadorResumoDto> ExecutarAsync(Guid restauranteId, CriarOperadorInputDto input, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(input);

        if (restauranteId == Guid.Empty)
            throw new ArgumentException("O ID do restaurante é obrigatório.", nameof(restauranteId));

        if (string.IsNullOrWhiteSpace(input.Nome))
            throw new ArgumentException("O nome do operador é obrigatório.", nameof(input.Nome));

        if (string.IsNullOrWhiteSpace(input.Pin) || input.Pin.Length != 4 || !input.Pin.All(char.IsDigit))
            throw new ArgumentException("O PIN deve conter exatamente 4 dígitos numéricos.", nameof(input.Pin));

        var role = string.IsNullOrWhiteSpace(input.Role) ? "Operator" : input.Role.Trim();
        if (role != "Operator" && role != "Manager")
            throw new ArgumentException("Cargo inválido. Permissões aceitas: Operator ou Manager.", nameof(input.Role));

        string emailFinal;
        if (!string.IsNullOrWhiteSpace(input.Email))
        {
            var emailNormalizado = input.Email.Trim().ToLowerInvariant();
            if (!emailNormalizado.Contains('@'))
                throw new ArgumentException("O e-mail informado é inválido.", nameof(input.Email));

            var jaExiste = await _usuarioRepository.ExisteEmailAsync(emailNormalizado, ct);
            if (jaExiste)
                throw new InvalidOperationException($"O e-mail '{emailNormalizado}' já está em uso por outro usuário.");

            emailFinal = emailNormalizado;
        }
        else
        {
            // Gera um e-mail interno único para operadores sem e-mail corporativo
            var prefixo = input.Nome.Trim().ToLowerInvariant().Replace(" ", ".");
            var idCurto = Guid.NewGuid().ToString("N")[..6];
            emailFinal = $"{prefixo}.{idCurto}@{restauranteId:N}.pdv.local";
        }

        var senhaHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString("N"));
        var pinHash = _passwordHasher.HashPassword(input.Pin.Trim());

        var novoUsuario = new Usuario(
            id: Guid.NewGuid(),
            restauranteId: restauranteId,
            nome: input.Nome.Trim(),
            email: emailFinal,
            senhaHash: senhaHash,
            role: role,
            ativo: true,
            criadoEm: DateTimeOffset.UtcNow,
            pinHash: pinHash
        );

        await _usuarioRepository.AdicionarAsync(novoUsuario, ct);
        await _unitOfWork.CommitAsync(ct);

        return new OperadorResumoDto(
            Id: novoUsuario.Id,
            Nome: novoUsuario.Nome,
            Email: novoUsuario.Email,
            Role: novoUsuario.Role,
            Iniciais: ExtrairIniciais(novoUsuario.Nome),
            Ativo: novoUsuario.Ativo,
            PossuiPin: true
        );
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
