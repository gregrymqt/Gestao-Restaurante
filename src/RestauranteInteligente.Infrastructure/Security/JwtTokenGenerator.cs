using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Emissor de tokens JWT com inclusão do claim jti único e dados multi-tenant segregados.
/// </summary>
public sealed class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtOptions _options;

    public JwtTokenGenerator(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public JwtTokenResult GenerateToken(
        Guid userId,
        Guid restauranteId,
        string email,
        string role,
        string? nome = null,
        TimeSpan? lifetime = null)
    {
        var jti = Guid.NewGuid().ToString("N");
        var expiration = DateTimeOffset.UtcNow.Add(lifetime ?? TimeSpan.FromMinutes(_options.ExpirationMinutes));

        var claimsList = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, jti),
            new("restaurante_id", restauranteId.ToString()),
            new(ClaimTypes.Role, role)
        };

        if (!string.IsNullOrWhiteSpace(nome))
        {
            claimsList.Add(new Claim(ClaimTypes.Name, nome));
            claimsList.Add(new Claim("name", nome));
        }

        var claims = claimsList.ToArray();

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            Expires = expiration.UtcDateTime,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var securityToken = handler.CreateToken(tokenDescriptor);
        var tokenString = handler.WriteToken(securityToken);

        return new JwtTokenResult(tokenString, jti, expiration);
    }
}
