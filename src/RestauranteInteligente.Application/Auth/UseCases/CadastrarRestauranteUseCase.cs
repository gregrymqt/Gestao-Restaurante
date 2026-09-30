using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Auth.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Auth.UseCases;

/// <summary>
/// Caso de uso atômico de auto-cadastro de novos inquilinos (Tenants) com Free Trial de 14 dias automático.
/// Cria o Restaurante, o Usuário Administrador/Gestor, a Assinatura Trial e emite as credenciais JWT.
/// </summary>
public sealed class CadastrarRestauranteUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRestauranteRepository _restauranteRepository;
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IAssinaturaRepository _assinaturaRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly ILogger<CadastrarRestauranteUseCase> _logger;

    public CadastrarRestauranteUseCase(
        IUnitOfWork unitOfWork,
        IRestauranteRepository restauranteRepository,
        IUsuarioRepository usuarioRepository,
        IAssinaturaRepository assinaturaRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator,
        IRefreshTokenService refreshTokenService,
        ILogger<CadastrarRestauranteUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _restauranteRepository = restauranteRepository ?? throw new ArgumentNullException(nameof(restauranteRepository));
        _usuarioRepository = usuarioRepository ?? throw new ArgumentNullException(nameof(usuarioRepository));
        _assinaturaRepository = assinaturaRepository ?? throw new ArgumentNullException(nameof(assinaturaRepository));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        _tokenGenerator = tokenGenerator ?? throw new ArgumentNullException(nameof(tokenGenerator));
        _refreshTokenService = refreshTokenService ?? throw new ArgumentNullException(nameof(refreshTokenService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<CadastrarRestauranteOutputDto> ExecutarAsync(CadastrarRestauranteInputDto input, CancellationToken ct = default)
    {
        if (input == null)
            throw new ArgumentNullException(nameof(input));

        if (string.IsNullOrWhiteSpace(input.NomeRestaurante))
            throw new ArgumentException("O nome do restaurante é obrigatório.", nameof(input.NomeRestaurante));

        if (string.IsNullOrWhiteSpace(input.Cnpj))
            throw new ArgumentException("O CNPJ ou documento é obrigatório.", nameof(input.Cnpj));

        if (string.IsNullOrWhiteSpace(input.NomeGestor))
            throw new ArgumentException("O nome do gestor é obrigatório.", nameof(input.NomeGestor));

        if (string.IsNullOrWhiteSpace(input.EmailGestor) || !input.EmailGestor.Contains('@'))
            throw new ArgumentException("Um e-mail válido para o gestor é obrigatório.", nameof(input.EmailGestor));

        if (string.IsNullOrWhiteSpace(input.SenhaGestor) || input.SenhaGestor.Length < 6)
            throw new ArgumentException("A senha deve possuir no mínimo 6 caracteres.", nameof(input.SenhaGestor));

        var cnpjLimpo = input.Cnpj.Trim();
        var emailLimpo = input.EmailGestor.Trim().ToLowerInvariant();

        // 1. Verificações de unicidade
        var existeCnpj = await _restauranteRepository.ExisteCnpjAsync(cnpjLimpo, ct);
        if (existeCnpj)
            throw new InvalidOperationException($"Já existe um restaurante cadastrado com o CNPJ '{cnpjLimpo}'.");

        var existeEmail = await _usuarioRepository.ExisteEmailAsync(emailLimpo, ct);
        if (existeEmail)
            throw new InvalidOperationException($"Já existe uma conta cadastrada com o e-mail '{emailLimpo}'.");

        // 2. Instanciação atômica do Inquilino (Restaurante)
        var restauranteId = Guid.NewGuid();
        var latitude = input.Latitude != 0m ? input.Latitude : -23.5505m; // Padrão SP caso não informada
        var longitude = input.Longitude != 0m ? input.Longitude : -46.6333m;

        var restaurante = new Restaurante(
            id: restauranteId,
            nome: input.NomeRestaurante.Trim(),
            cnpj: cnpjLimpo,
            cidade: string.IsNullOrWhiteSpace(input.Cidade) ? "São Paulo" : input.Cidade.Trim(),
            estado: string.IsNullOrWhiteSpace(input.Estado) ? "SP" : input.Estado.Trim(),
            latitude: latitude,
            longitude: longitude
        );

        // 3. Instanciação do Usuário Gestor/Proprietário com hash criptográfico seguro
        var senhaHash = _passwordHasher.HashPassword(input.SenhaGestor);
        var usuarioId = Guid.NewGuid();

        var usuario = new Usuario(
            id: usuarioId,
            restauranteId: restauranteId,
            nome: input.NomeGestor.Trim(),
            email: emailLimpo,
            senhaHash: senhaHash,
            role: "Manager",
            ativo: true
        );

        // 4. Instanciação da Assinatura SaaS com Free Trial de 14 dias
        var dataInicio = DateTimeOffset.UtcNow;
        var dataFimTrial = dataInicio.AddDays(14);

        var assinatura = new Assinatura(
            id: Guid.NewGuid(),
            restauranteId: restauranteId,
            dataInicio: dataInicio,
            dataFimTrial: dataFimTrial
        );

        // 5. Persistência atômica via Unit of Work
        await _restauranteRepository.AdicionarAsync(restaurante, ct);
        await _usuarioRepository.AdicionarAsync(usuario, ct);
        await _assinaturaRepository.AdicionarAsync(assinatura, ct);

        await _unitOfWork.CommitAsync(ct);

        _logger.LogInformation("Novo restaurante '{Nome}' ({RestauranteId}) cadastrado com sucesso. Gestor: '{Gestor}' ({UsuarioId}). Free Trial até {FimTrial}.",
            restaurante.Nome, restauranteId, usuario.Nome, usuarioId, dataFimTrial);

        // 6. Geração de tokens de autenticação imediata (Zero Friction Login)
        var tokenResult = _tokenGenerator.GenerateToken(
            userId: usuarioId,
            restauranteId: restauranteId,
            email: usuario.Email,
            role: usuario.Role,
            lifetime: TimeSpan.FromMinutes(15)
        );

        var refreshToken = await _refreshTokenService.CreateRefreshTokenAsync(
            userId: usuarioId,
            restauranteId: restauranteId,
            ct: ct
        );

        return new CadastrarRestauranteOutputDto(
            RestauranteId: restauranteId,
            NomeRestaurante: restaurante.Nome,
            UsuarioId: usuarioId,
            NomeGestor: usuario.Nome,
            Email: usuario.Email,
            Token: tokenResult.Token,
            RefreshToken: refreshToken,
            DiasRestantesTrial: assinatura.DiasRestantesTrial(),
            StatusAssinatura: assinatura.Status.ToString().ToUpperInvariant()
        );
    }
}
