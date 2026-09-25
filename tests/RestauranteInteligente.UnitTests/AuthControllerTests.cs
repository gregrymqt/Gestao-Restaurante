using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Domain.Common.Interfaces;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class AuthControllerTests
{
    private readonly Mock<IJwtTokenGenerator> _tokenGeneratorMock;
    private readonly Mock<ITokenBlacklistService> _blacklistServiceMock;
    private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _tokenGeneratorMock = new Mock<IJwtTokenGenerator>();
        _blacklistServiceMock = new Mock<ITokenBlacklistService>();
        _refreshTokenServiceMock = new Mock<IRefreshTokenService>();

        _controller = new AuthController(
            _tokenGeneratorMock.Object,
            _blacklistServiceMock.Object,
            _refreshTokenServiceMock.Object,
            NullLogger<AuthController>.Instance
        );
    }

    [Fact]
    public async Task Login_ComCredenciaisValidas_DeveRetornarOkComTokenRefreshTokenEJti()
    {
        var expectedJti = Guid.NewGuid().ToString("N");
        var expectedExpires = DateTimeOffset.UtcNow.AddMinutes(15);
        var expectedRefreshToken = "ref-token-xyz-123";

        _tokenGeneratorMock.Setup(g => g.GenerateToken(
            It.IsAny<Guid>(),
            It.IsAny<Guid>(),
            "admin@teste.com",
            "Manager",
            It.IsAny<TimeSpan?>()
        )).Returns(new JwtTokenResult("jwt.token.mock", expectedJti, expectedExpires));

        _refreshTokenServiceMock.Setup(r => r.CreateRefreshTokenAsync(
            It.IsAny<Guid>(),
            It.IsAny<Guid>(),
            It.IsAny<string?>(),
            It.IsAny<TimeSpan?>(),
            It.IsAny<CancellationToken>()
        )).ReturnsAsync(expectedRefreshToken);

        var result = await _controller.Login(new LoginRequest("admin@teste.com", "senha123"), CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        var response = (LoginResponse)okResult.Value!;

        response.Token.Should().Be("jwt.token.mock");
        response.RefreshToken.Should().Be(expectedRefreshToken);
        response.Jti.Should().Be(expectedJti);
    }

    [Fact]
    public async Task Login_ComCredenciaisInvalidas_DeveRetornarUnauthorized()
    {
        var result = await _controller.Login(new LoginRequest("admin@teste.com", "senha_errada"), CancellationToken.None);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Refresh_ComTokenValido_DeveRetornarNovoParDeTokens()
    {
        var userId = Guid.NewGuid();
        var restauranteId = Guid.NewGuid();
        var familyId = "fam-777";

        _refreshTokenServiceMock.Setup(r => r.RotateRefreshTokenAsync("refresh-valido", It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, userId, restauranteId, familyId));

        _tokenGeneratorMock.Setup(g => g.GenerateToken(
            userId,
            restauranteId,
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<TimeSpan?>()
        )).Returns(new JwtTokenResult("novo.jwt.token", "novo-jti", DateTimeOffset.UtcNow.AddMinutes(15)));

        _refreshTokenServiceMock.Setup(r => r.CreateRefreshTokenAsync(
            userId,
            restauranteId,
            familyId,
            It.IsAny<TimeSpan?>(),
            It.IsAny<CancellationToken>()
        )).ReturnsAsync("novo-refresh-token");

        var result = await _controller.Refresh(new RefreshTokenRequest("refresh-valido"), CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        var response = (RefreshTokenResponse)okResult.Value!;

        response.Token.Should().Be("novo.jwt.token");
        response.RefreshToken.Should().Be("novo-refresh-token");
    }

    [Fact]
    public async Task Logout_ComUsuarioAutenticado_DeveInserirJtiNaBlacklist()
    {
        var jti = "jwt-session-42";
        var expSeconds = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Jti, jti),
            new Claim(JwtRegisteredClaimNames.Exp, expSeconds.ToString())
        };

        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        var result = await _controller.Logout(new LogoutRequest(), CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();

        _blacklistServiceMock.Verify(b => b.RevokeTokenAsync(
            jti,
            It.Is<TimeSpan>(t => t > TimeSpan.Zero),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }
}
