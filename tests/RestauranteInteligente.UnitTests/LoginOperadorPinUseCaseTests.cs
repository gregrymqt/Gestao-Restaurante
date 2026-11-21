using FluentAssertions;
using Moq;
using RestauranteInteligente.Application.Auth.DTOs;
using RestauranteInteligente.Application.Auth.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class LoginOperadorPinUseCaseTests
{
    private readonly Guid _restauranteId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _usuarioId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    [Fact]
    public async Task ExecutarAsync_ComCredenciaisValidas_DeveEmitirJwtERefreshToken()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();
        var tokenGenMock = new Mock<IJwtTokenGenerator>();
        var refreshServiceMock = new Mock<IRefreshTokenService>();

        var usuario = new Usuario(_usuarioId, _restauranteId, "Operador Caixa", "op@restaurante.com", "senhaHash", "Operator", pinHash: "hashed_5678");

        repoMock.Setup(r => r.ObterPorIdAsync(_usuarioId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);
        hasherMock.Setup(h => h.VerifyPassword("5678", "hashed_5678"))
            .Returns(true);
        tokenGenMock.Setup(t => t.GenerateToken(_usuarioId, _restauranteId, usuario.Email, "Operator", "Operador Caixa", It.IsAny<TimeSpan?>()))
            .Returns(new JwtTokenResult("token_jwt_pdv", "jti_123", DateTimeOffset.UtcNow.AddHours(10)));
        refreshServiceMock.Setup(r => r.CreateRefreshTokenAsync(_usuarioId, _restauranteId, It.IsAny<string?>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("refresh_token_pdv");

        var useCase = new LoginOperadorPinUseCase(repoMock.Object, hasherMock.Object, tokenGenMock.Object, refreshServiceMock.Object);
        var request = new LoginOperadorPinRequestDto(_restauranteId, _usuarioId, "5678");

        var resultado = await useCase.ExecutarAsync(request);

        resultado.Should().NotBeNull();
        resultado.Token.Should().Be("token_jwt_pdv");
        resultado.RefreshToken.Should().Be("refresh_token_pdv");
        resultado.Nome.Should().Be("Operador Caixa");
        resultado.Role.Should().Be("Operator");
        resultado.RestauranteId.Should().Be(_restauranteId);
    }

    [Fact]
    public async Task ExecutarAsync_ComPinIncorreto_DeveLancarUnauthorizedAccessException()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();
        var tokenGenMock = new Mock<IJwtTokenGenerator>();
        var refreshServiceMock = new Mock<IRefreshTokenService>();

        var usuario = new Usuario(_usuarioId, _restauranteId, "Operador Caixa", "op@restaurante.com", "senhaHash", "Operator", pinHash: "hashed_5678");

        repoMock.Setup(r => r.ObterPorIdAsync(_usuarioId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);
        hasherMock.Setup(h => h.VerifyPassword("0000", "hashed_5678"))
            .Returns(false);

        var useCase = new LoginOperadorPinUseCase(repoMock.Object, hasherMock.Object, tokenGenMock.Object, refreshServiceMock.Object);
        var request = new LoginOperadorPinRequestDto(_restauranteId, _usuarioId, "0000");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => useCase.ExecutarAsync(request));
    }

    [Fact]
    public async Task ExecutarAsync_ComUsuarioDeOutroRestaurante_DeveLancarUnauthorizedAccessException()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();
        var tokenGenMock = new Mock<IJwtTokenGenerator>();
        var refreshServiceMock = new Mock<IRefreshTokenService>();

        var outroRestauranteId = Guid.NewGuid();
        var usuario = new Usuario(_usuarioId, outroRestauranteId, "Operador", "op@outro.com", "hash", "Operator", pinHash: "hashed_5678");

        repoMock.Setup(r => r.ObterPorIdAsync(_usuarioId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        var useCase = new LoginOperadorPinUseCase(repoMock.Object, hasherMock.Object, tokenGenMock.Object, refreshServiceMock.Object);
        var request = new LoginOperadorPinRequestDto(_restauranteId, _usuarioId, "5678");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => useCase.ExecutarAsync(request));
    }

    [Fact]
    public async Task ExecutarAsync_ComUsuarioSemPin_Fallback1234_DeveAutenticar()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();
        var tokenGenMock = new Mock<IJwtTokenGenerator>();
        var refreshServiceMock = new Mock<IRefreshTokenService>();

        var usuario = new Usuario(_usuarioId, _restauranteId, "Operador Legado", "op@restaurante.com", "senhaHash", "Operator", pinHash: null);

        repoMock.Setup(r => r.ObterPorIdAsync(_usuarioId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);
        tokenGenMock.Setup(t => t.GenerateToken(_usuarioId, _restauranteId, usuario.Email, "Operator", "Operador Legado", It.IsAny<TimeSpan?>()))
            .Returns(new JwtTokenResult("token_fallback", "jti_456", DateTimeOffset.UtcNow.AddHours(10)));
        refreshServiceMock.Setup(r => r.CreateRefreshTokenAsync(_usuarioId, _restauranteId, It.IsAny<string?>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("refresh_fallback");

        var useCase = new LoginOperadorPinUseCase(repoMock.Object, hasherMock.Object, tokenGenMock.Object, refreshServiceMock.Object);
        var request = new LoginOperadorPinRequestDto(_restauranteId, _usuarioId, "1234");

        var resultado = await useCase.ExecutarAsync(request);

        resultado.Token.Should().Be("token_fallback");
        resultado.Role.Should().Be("Operator");
    }
}
