using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Application.Auth.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class AuthUseCasesTests
{
    private readonly Guid _tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _userId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    [Fact]
    public async Task ValidarPin_ComPinCorreto_DeveRetornarTrue()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();

        var usuario = new Usuario(_userId, _tenantId, "Operador", "op@restaurante.com", "hash", "Cashier", pinHash: "hashed_1234");
        repoMock.Setup(r => r.ObterPorIdAsync(_userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);
        hasherMock.Setup(h => h.VerifyPassword("1234", "hashed_1234"))
            .Returns(true);

        var useCase = new ValidarPinTerminalUseCase(repoMock.Object, hasherMock.Object);
        var valido = await useCase.ExecutarAsync(_userId, "1234");

        valido.Should().BeTrue();
    }

    [Fact]
    public async Task ValidarPin_SemPinCadastrado_ComFallback1234_DeveRetornarTrue()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();

        var usuario = new Usuario(_userId, _tenantId, "Operador", "op@restaurante.com", "hash", "Cashier", pinHash: null);
        repoMock.Setup(r => r.ObterPorIdAsync(_userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        var useCase = new ValidarPinTerminalUseCase(repoMock.Object, hasherMock.Object);
        var valido = await useCase.ExecutarAsync(_userId, "1234");

        valido.Should().BeTrue();
    }

    [Fact]
    public async Task ValidarPin_ComFormatoInvalido_DeveLancarArgumentException()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();

        var useCase = new ValidarPinTerminalUseCase(repoMock.Object, hasherMock.Object);

        await Assert.ThrowsAsync<ArgumentException>(() => useCase.ExecutarAsync(_userId, "12"));
        await Assert.ThrowsAsync<ArgumentException>(() => useCase.ExecutarAsync(_userId, "1234567"));
        await Assert.ThrowsAsync<ArgumentException>(() => useCase.ExecutarAsync(_userId, "abcd"));
    }

    [Fact]
    public async Task DefinirPin_ComPinValido_DeveAtualizarPinHash()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();

        var usuario = new Usuario(_userId, _tenantId, "Operador", "op@restaurante.com", "hash", "Cashier");
        repoMock.Setup(r => r.ObterPorIdAsync(_userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);
        hasherMock.Setup(h => h.HashPassword("54321"))
            .Returns("hash_54321");

        var useCase = new DefinirPinTerminalUseCase(repoMock.Object, hasherMock.Object);
        await useCase.ExecutarAsync(_userId, "54321");

        usuario.PinHash.Should().Be("hash_54321");
        repoMock.Verify(r => r.AtualizarAsync(usuario, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SolicitarRecuperacaoSenha_ComEmailValido_DeveGerarOtp()
    {
        var authServiceMock = new Mock<IAuthUserService>();
        var tokenServiceMock = new Mock<IPasswordResetTokenService>();

        authServiceMock.Setup(a => a.FindByEmailAsync("gestor@restaurante.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount(_userId, _tenantId, "Gestor", "gestor@restaurante.com", "hash", "Manager"));

        tokenServiceMock.Setup(t => t.GerarOtpAsync("gestor@restaurante.com", It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("654321");

        var useCase = new SolicitarRecuperacaoSenhaUseCase(authServiceMock.Object, tokenServiceMock.Object, NullLogger<SolicitarRecuperacaoSenhaUseCase>.Instance);
        var result = await useCase.ExecutarAsync("gestor@restaurante.com");

        result.ExpiracaoMinutos.Should().Be(15);
        tokenServiceMock.Verify(t => t.GerarOtpAsync("gestor@restaurante.com", TimeSpan.FromMinutes(15), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RedefinirSenha_ComOtpValido_DeveAtualizarSenha()
    {
        var tokenServiceMock = new Mock<IPasswordResetTokenService>();
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();

        var email = "gestor@restaurante.com";
        var usuario = new Usuario(_userId, _tenantId, "Gestor", email, "antiga_hash", "Manager");

        tokenServiceMock.Setup(t => t.ValidarEConsumirOtpAsync(email, "123456", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        repoMock.Setup(r => r.ObterPorEmailAsync(email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);
        hasherMock.Setup(h => h.HashPassword("NovaSenhaForte123"))
            .Returns("nova_hash_forte");

        var useCase = new RedefinirSenhaUseCase(tokenServiceMock.Object, repoMock.Object, hasherMock.Object, NullLogger<RedefinirSenhaUseCase>.Instance);
        await useCase.ExecutarAsync(email, "123456", "NovaSenhaForte123");

        usuario.SenhaHash.Should().Be("nova_hash_forte");
        repoMock.Verify(r => r.AtualizarAsync(usuario, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RedefinirSenha_ComOtpInvalido_DeveLancarInvalidOperationException()
    {
        var tokenServiceMock = new Mock<IPasswordResetTokenService>();
        var repoMock = new Mock<IUsuarioRepository>();
        var hasherMock = new Mock<IPasswordHasher>();

        var email = "gestor@restaurante.com";
        tokenServiceMock.Setup(t => t.ValidarEConsumirOtpAsync(email, "999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var useCase = new RedefinirSenhaUseCase(tokenServiceMock.Object, repoMock.Object, hasherMock.Object, NullLogger<RedefinirSenhaUseCase>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() => useCase.ExecutarAsync(email, "999999", "NovaSenha123"));
    }
}
