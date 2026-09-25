using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Options;
using RestauranteInteligente.Infrastructure.Security;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class JwtTokenGeneratorTests
{
    private readonly JwtTokenGenerator _generator;
    private readonly JwtOptions _options;

    public JwtTokenGeneratorTests()
    {
        _options = new JwtOptions
        {
            Issuer = "RestauranteInteligente",
            Audience = "RestauranteInteligente.App",
            Key = "SuperChaveSecretaParaTestesUnitariosDeTokenJwt123456!",
            ExpirationMinutes = 30
        };

        _generator = new JwtTokenGenerator(Options.Create(_options));
    }

    [Fact]
    public void GenerateToken_DeveEmitirTokenComClaimsMultiTenantEJti()
    {
        var userId = Guid.NewGuid();
        var restauranteId = Guid.NewGuid();
        var email = "gerente@restaurante.com";
        var role = "Manager";

        var result = _generator.GenerateToken(userId, restauranteId, email, role);

        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrWhiteSpace();
        result.Jti.Should().NotBeNullOrWhiteSpace();
        result.ExpiresAt.Should().BeAfter(DateTimeOffset.UtcNow);

        // Decodificação e inspeção do token
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.Token);

        jwt.Issuer.Should().Be(_options.Issuer);
        jwt.Audiences.Should().Contain(_options.Audience);

        jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Sub || c.Type == "sub").Value.Should().Be(userId.ToString());
        jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email || c.Type == "email").Value.Should().Be(email);
        jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Jti || c.Type == "jti").Value.Should().Be(result.Jti);
        jwt.Claims.First(c => c.Type == "restaurante_id").Value.Should().Be(restauranteId.ToString());
        jwt.Claims.First(c => c.Type == "role" || c.Type == ClaimTypes.Role).Value.Should().Be(role);
    }
}
