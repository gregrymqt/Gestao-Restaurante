using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Application.Admin.DTOs;
using RestauranteInteligente.Application.Admin.UseCases;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Infrastructure.Security;
using Xunit;

namespace RestauranteInteligente.UnitTests;

/// <summary>
/// Bateria de Testes Discriminatórios de RBAC & Broken Access Control (OWASP Top 10 A01:2021).
/// Valida se o sistema discrimina rigorosamente as funções e privilégios dos usuários,
/// impedindo elevação de privilégios horizontal ou vertical e bloqueando tentativas
/// de usuários operacionais ou inquilinos acessarem o Backoffice e endpoints administrativos.
/// </summary>
public sealed class RbacAuthorizationDiscriminatoryTests
{
    private readonly Mock<IRestauranteRepository> _restauranteRepoMock = new();
    private readonly Mock<IAssinaturaRepository> _assinaturaRepoMock = new();
    private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private AdminController CreateAdminControllerWithUser(string? role, bool isAuthenticated = true)
    {
        var listarUseCase = new ListarTenantsAdminUseCase(
            _restauranteRepoMock.Object,
            _assinaturaRepoMock.Object,
            _usuarioRepoMock.Object,
            NullLogger<ListarTenantsAdminUseCase>.Instance
        );

        var estenderTrialUseCase = new EstenderTrialTenantUseCase(
            _assinaturaRepoMock.Object,
            _restauranteRepoMock.Object,
            _unitOfWorkMock.Object,
            NullLogger<EstenderTrialTenantUseCase>.Instance
        );

        var alterarStatusUseCase = new AlterarStatusAssinaturaAdminUseCase(
            _assinaturaRepoMock.Object,
            _restauranteRepoMock.Object,
            _unitOfWorkMock.Object,
            NullLogger<AlterarStatusAssinaturaAdminUseCase>.Instance
        );

        var controller = new AdminController(listarUseCase, estenderTrialUseCase, alterarStatusUseCase);

        ClaimsPrincipal principal;
        if (isAuthenticated)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new(ClaimTypes.Email, "teste@restaurante.com")
            };

            if (!string.IsNullOrWhiteSpace(role))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        }
        else
        {
            principal = new ClaimsPrincipal(new ClaimsIdentity());
        }

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        return controller;
    }

    [Fact]
    public void AdminController_SegurancaDeclarativa_DevePossuirAtributoAuthorizeComRolesSuperAdminEAdmin()
    {
        // Assert: Validação estática de arquitetura para garantir que nenhum refactoring remova a restrição de roles
        var authorizeAttribute = typeof(AdminController).GetCustomAttribute<AuthorizeAttribute>();

        authorizeAttribute.Should().NotBeNull("AdminController deve ter o atributo [Authorize]");
        authorizeAttribute!.Roles.Should().NotBeNullOrWhiteSpace("o atributo [Authorize] deve definir restrição explícita de Roles");
        authorizeAttribute.Roles.Should().Contain("SuperAdmin");
        authorizeAttribute.Roles.Should().Contain("Admin");
    }

    [Theory]
    [InlineData("Manager")]
    [InlineData("Operator")]
    [InlineData("Cashier")]
    [InlineData("Waiter")]
    [InlineData("Kitchen")]
    public async Task ListarTenants_ComPerfilNaoAutorizado_DeveDiscriminarERetornarForbid403(string roleNaoAutorizada)
    {
        // Arrange
        var controller = CreateAdminControllerWithUser(roleNaoAutorizada);

        // Act
        var resultado = await controller.ListarTenants(CancellationToken.None);

        // Assert
        resultado.Should().BeOfType<ForbidResult>(
            $"o perfil '{roleNaoAutorizada}' não é SuperAdmin nem Admin e deve ser categoricamente barrado com 403 Forbidden");
    }

    [Fact]
    public async Task ListarTenants_ComUsuarioAnonimoNaoAutenticado_DeveDiscriminarERetornarForbid403()
    {
        // Arrange
        var controller = CreateAdminControllerWithUser(null, isAuthenticated: false);

        // Act
        var resultado = await controller.ListarTenants(CancellationToken.None);

        // Assert
        resultado.Should().BeOfType<ForbidResult>("usuário anônimo deve ser barrado com 403 Forbidden");
    }

    [Theory]
    [InlineData("SuperAdmin")]
    [InlineData("Admin")]
    public async Task ListarTenants_ComPerfilSuperAdminOuAdmin_DevePermitirAcessoRetornando200Ok(string roleAutorizada)
    {
        // Arrange
        _restauranteRepoMock.Setup(r => r.ObterTodosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Restaurante>());
        _assinaturaRepoMock.Setup(a => a.ObterTodasAssinaturasAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Assinatura>());
        _usuarioRepoMock.Setup(u => u.ObterTodosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Usuario>());
        _assinaturaRepoMock.Setup(a => a.ObterPlanosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Plano>());

        var controller = CreateAdminControllerWithUser(roleAutorizada);

        // Act
        var resultado = await controller.ListarTenants(CancellationToken.None);

        // Assert
        resultado.Should().BeOfType<OkObjectResult>("SuperAdmin e Admin devem ter acesso pleno ao Backoffice");
    }

    [Theory]
    [InlineData("Manager")]
    [InlineData("Operator")]
    [InlineData("Cashier")]
    public async Task EstenderTrial_ComPerfilNaoAutorizado_DeveDiscriminarERetornarForbid403(string roleNaoAutorizada)
    {
        // Arrange
        var controller = CreateAdminControllerWithUser(roleNaoAutorizada);
        var input = new EstenderTrialInputDto(7);

        // Act
        var resultado = await controller.EstenderTrial(Guid.NewGuid(), input, CancellationToken.None);

        // Assert
        resultado.Should().BeOfType<ForbidResult>(
            $"o perfil '{roleNaoAutorizada}' não tem permissão para alterar vigência de assinaturas de inquilinos");
    }

    [Theory]
    [InlineData("Manager")]
    [InlineData("Operator")]
    [InlineData("Cashier")]
    public async Task AlterarStatus_ComPerfilNaoAutorizado_DeveDiscriminarERetornarForbid403(string roleNaoAutorizada)
    {
        // Arrange
        var controller = CreateAdminControllerWithUser(roleNaoAutorizada);
        var input = new AlterarStatusAssinaturaInputDto("CANCELADA", null);

        // Act
        var resultado = await controller.AlterarStatus(Guid.NewGuid(), input, CancellationToken.None);

        // Assert
        resultado.Should().BeOfType<ForbidResult>(
            $"o perfil '{roleNaoAutorizada}' não tem permissão para alterar o status contratual de inquilinos");
    }

    [Theory]
    [InlineData("SuperAdmin")]
    [InlineData("Admin")]
    [InlineData("Manager")]
    [InlineData("Operator")]
    public void JwtTokenGenerator_DeveEmitirClaimDeRoleEstritamenteConformePerfil(string roleEsperada)
    {
        // Arrange
        var jwtOptions = Options.Create(new JwtOptions
        {
            Key = "chave-super-secreta-para-testes-unitarios-restaurante-inteligente-32bytes!",
            Issuer = "RestauranteInteligente.Test",
            Audience = "RestauranteInteligente.Client",
            ExpirationMinutes = 60
        });

        var generator = new JwtTokenGenerator(jwtOptions);
        var userId = Guid.NewGuid();
        var restauranteId = Guid.NewGuid();

        // Act
        var result = generator.GenerateToken(userId, restauranteId, "teste@restaurante.com", roleEsperada, "Nome Teste");

        // Assert
        result.Token.Should().NotBeNullOrWhiteSpace();

        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(result.Token);

        var roleClaim = token.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role");
        roleClaim.Should().NotBeNull();
        roleClaim!.Value.Should().Be(roleEsperada);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Usuario_AtualizarPerfil_ComRoleInvalida_DeveLancarArgumentException(string? roleInvalida)
    {
        // Arrange
        var usuario = new Usuario(Guid.NewGuid(), Guid.NewGuid(), "Nome", "email@restaurante.com", "hash123", "Manager");

        // Act
        var act = () => usuario.AtualizarPerfil("Novo Nome", roleInvalida!);

        // Assert
        act.Should().Throw<ArgumentException>("uma role não pode ser vazia, nula ou composta apenas de espaços");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Usuario_Instanciacao_ComRoleInvalida_DeveLancarArgumentException(string roleInvalida)
    {
        // Act
        var act = () => new Usuario(Guid.NewGuid(), Guid.NewGuid(), "Nome", "email@restaurante.com", "hash123", roleInvalida);

        // Assert
        act.Should().Throw<ArgumentException>("a role do usuário é obrigatória na criação da entidade");
    }
}
