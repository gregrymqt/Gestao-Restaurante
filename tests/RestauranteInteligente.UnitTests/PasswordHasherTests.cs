using FluentAssertions;
using RestauranteInteligente.Infrastructure.Security;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void HashPassword_ComSenhaValida_DeveGerarHashNoFormatoPBKDF2ComSalt()
    {
        var password = "MinhaSenhaForte2026!#";
        var hash = _hasher.HashPassword(password);

        hash.Should().NotBeNullOrWhiteSpace();
        var parts = hash.Split('.');
        parts.Length.Should().Be(3);
        parts[0].Should().Be("100000"); // Iterations
        parts[1].Should().NotBeEmpty(); // Salt
        parts[2].Should().NotBeEmpty(); // Subkey
    }

    [Fact]
    public void VerifyPassword_ComSenhaCorreta_DeveRetornarTrue()
    {
        var password = "MinhaSenhaForte2026!#";
        var hash = _hasher.HashPassword(password);

        var isValid = _hasher.VerifyPassword(password, hash);

        isValid.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_ComSenhaIncorreta_DeveRetornarFalse()
    {
        var password = "MinhaSenhaForte2026!#";
        var hash = _hasher.HashPassword(password);

        var isValid = _hasher.VerifyPassword("SenhaErrada", hash);

        isValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void VerifyPassword_ComParametrosInvalidos_DeveRetornarFalse(string? invalidInput)
    {
        var hash = _hasher.HashPassword("Valida123!");

        _hasher.VerifyPassword(invalidInput!, hash).Should().BeFalse();
        _hasher.VerifyPassword("Valida123!", invalidInput!).Should().BeFalse();
    }
}
