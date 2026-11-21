using FluentAssertions;
using Moq;
using RestauranteInteligente.Application.Auth.DTOs;
using RestauranteInteligente.Application.Auth.UseCases;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class CriarOperadorUseCaseTests
{
    private readonly Guid _restauranteId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task ExecutarAsync_ComDadosValidos_DeveCadastrarComPinHashEUnitOfWork()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var uowMock = new Mock<IUnitOfWork>();
        var hasherMock = new Mock<IPasswordHasher>();

        repoMock.Setup(r => r.ExisteEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        hasherMock.Setup(h => h.HashPassword(It.IsAny<string>()))
            .Returns("hashed_pin_1234");

        var useCase = new CriarOperadorUseCase(repoMock.Object, uowMock.Object, hasherMock.Object);
        var input = new CriarOperadorInputDto("Carlos Silva", "carlos@restaurante.com", "Operator", "1234");

        var resultado = await useCase.ExecutarAsync(_restauranteId, input);

        resultado.Should().NotBeNull();
        resultado.Nome.Should().Be("Carlos Silva");
        resultado.Role.Should().Be("Operator");
        resultado.Iniciais.Should().Be("CS");
        resultado.PossuiPin.Should().BeTrue();

        repoMock.Verify(r => r.AdicionarAsync(It.Is<Usuario>(u =>
            u.Nome == "Carlos Silva" &&
            u.RestauranteId == _restauranteId &&
            u.Role == "Operator" &&
            u.PinHash == "hashed_pin_1234"
        ), It.IsAny<CancellationToken>()), Times.Once);

        uowMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecutarAsync_SemEmail_DeveGerarEmailInternoValido()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var uowMock = new Mock<IUnitOfWork>();
        var hasherMock = new Mock<IPasswordHasher>();

        hasherMock.Setup(h => h.HashPassword(It.IsAny<string>()))
            .Returns("hashed_secret");

        var useCase = new CriarOperadorUseCase(repoMock.Object, uowMock.Object, hasherMock.Object);
        var input = new CriarOperadorInputDto("Maria Souza", null, "Operator", "4321");

        var resultado = await useCase.ExecutarAsync(_restauranteId, input);

        resultado.Email.Should().Contain("@");
        resultado.Email.Should().Contain(".pdv.local");
        resultado.Iniciais.Should().Be("MS");

        repoMock.Verify(r => r.AdicionarAsync(It.Is<Usuario>(u =>
            u.Email.EndsWith(".pdv.local") &&
            u.RestauranteId == _restauranteId
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("12")]
    [InlineData("12345")]
    [InlineData("abcd")]
    [InlineData("")]
    public async Task ExecutarAsync_ComPinInvalido_DeveLancarArgumentException(string pinInvalido)
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var uowMock = new Mock<IUnitOfWork>();
        var hasherMock = new Mock<IPasswordHasher>();

        var useCase = new CriarOperadorUseCase(repoMock.Object, uowMock.Object, hasherMock.Object);
        var input = new CriarOperadorInputDto("Lucas Lima", null, "Operator", pinInvalido);

        await Assert.ThrowsAsync<ArgumentException>(() => useCase.ExecutarAsync(_restauranteId, input));
    }

    [Fact]
    public async Task ExecutarAsync_ComEmailDuplicado_DeveLancarInvalidOperationException()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var uowMock = new Mock<IUnitOfWork>();
        var hasherMock = new Mock<IPasswordHasher>();

        repoMock.Setup(r => r.ExisteEmailAsync("jaexiste@restaurante.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var useCase = new CriarOperadorUseCase(repoMock.Object, uowMock.Object, hasherMock.Object);
        var input = new CriarOperadorInputDto("Lucas Lima", "jaexiste@restaurante.com", "Operator", "9876");

        await Assert.ThrowsAsync<InvalidOperationException>(() => useCase.ExecutarAsync(_restauranteId, input));
    }

    [Fact]
    public async Task ExecutarAsync_ComRoleInvalida_DeveLancarArgumentException()
    {
        var repoMock = new Mock<IUsuarioRepository>();
        var uowMock = new Mock<IUnitOfWork>();
        var hasherMock = new Mock<IPasswordHasher>();

        var useCase = new CriarOperadorUseCase(repoMock.Object, uowMock.Object, hasherMock.Object);
        var input = new CriarOperadorInputDto("Lucas Lima", null, "RoleInexistente", "9876");

        await Assert.ThrowsAsync<ArgumentException>(() => useCase.ExecutarAsync(_restauranteId, input));
    }
}
