using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;
using RestauranteInteligente.Infrastructure.Security;
using StackExchange.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RedisRefreshTokenServiceTests
{
    private readonly Mock<IRedisConnectionFactory> _factoryMock;
    private readonly Mock<IDatabase> _databaseMock;
    private readonly RedisRefreshTokenService _service;
    private readonly JwtOptions _options;

    public RedisRefreshTokenServiceTests()
    {
        _factoryMock = new Mock<IRedisConnectionFactory>();
        _databaseMock = new Mock<IDatabase>();
        _factoryMock.Setup(f => f.GetDatabase()).Returns(_databaseMock.Object);

        _options = new JwtOptions
        {
            RefreshTokenExpirationDays = 7
        };

        _service = new RedisRefreshTokenService(
            _factoryMock.Object,
            Options.Create(_options),
            NullLogger<RedisRefreshTokenService>.Instance
        );
    }

    [Fact]
    public async Task CreateRefreshTokenAsync_DevePersistirSessaoESalvarFamiliaNoRedis()
    {
        var userId = Guid.NewGuid();
        var restauranteId = Guid.NewGuid();

        var token = await _service.CreateRefreshTokenAsync(userId, restauranteId);

        token.Should().NotBeNullOrWhiteSpace();

        _databaseMock.Verify(db => db.StringSetAsync(
            It.Is<RedisKey>(k => k.ToString().StartsWith("refreshtoken:")),
            It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan?>(),
            When.Always,
            CommandFlags.None
        ), Times.Once);

        _databaseMock.Verify(db => db.SetAddAsync(
            It.Is<RedisKey>(k => k.ToString().StartsWith("tokenfamily:")),
            It.IsAny<RedisValue>(),
            CommandFlags.None
        ), Times.Once);
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_QuandoTokenValidoENaoUsado_DeveConsumirERetornarSucesso()
    {
        var userId = Guid.NewGuid();
        var restauranteId = Guid.NewGuid();
        var familyId = "fam-123";
        var token = "token-valido-123";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
        var tokenKey = RedisKeyHelper.BuildRefreshTokenKey(tokenHash);

        var session = new RefreshTokenSession(
            TokenHash: tokenHash,
            UserId: userId,
            RestauranteId: restauranteId,
            FamilyId: familyId,
            ExpiresAt: DateTimeOffset.UtcNow.AddDays(7),
            IsUsed: false
        );

        _databaseMock.Setup(db => db.StringGetAsync(tokenKey, CommandFlags.None))
            .ReturnsAsync(JsonSerializer.Serialize(session));

        var (success, resUserId, resRestId, resFamId) = await _service.RotateRefreshTokenAsync(token);

        success.Should().BeTrue();
        resUserId.Should().Be(userId);
        resRestId.Should().Be(restauranteId);
        resFamId.Should().Be(familyId);

        // Verifica marcação do token como usado
        _databaseMock.Verify(db => db.StringSetAsync(
            tokenKey,
            It.Is<RedisValue>(v => v.ToString().Contains("\"IsUsed\":true")),
            It.IsAny<TimeSpan?>(),
            When.Always,
            CommandFlags.None
        ), Times.Once);
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_QuandoTokenJaUsado_DeveDetectarRouboEInvalidarFamilia()
    {
        var userId = Guid.NewGuid();
        var restauranteId = Guid.NewGuid();
        var familyId = "fam-roubada-999";
        var token = "token-ja-usado-456";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
        var tokenKey = RedisKeyHelper.BuildRefreshTokenKey(tokenHash);
        var familyKey = RedisKeyHelper.BuildTokenFamilyKey(familyId);

        var compromisedSession = new RefreshTokenSession(
            TokenHash: tokenHash,
            UserId: userId,
            RestauranteId: restauranteId,
            FamilyId: familyId,
            ExpiresAt: DateTimeOffset.UtcNow.AddDays(7),
            IsUsed: true // JÁ FOI USADO!
        );

        _databaseMock.Setup(db => db.StringGetAsync(tokenKey, CommandFlags.None))
            .ReturnsAsync(JsonSerializer.Serialize(compromisedSession));

        _databaseMock.Setup(db => db.SetMembersAsync(familyKey, CommandFlags.None))
            .ReturnsAsync([ (RedisValue)tokenHash ]);

        var (success, _, _, _) = await _service.RotateRefreshTokenAsync(token);

        success.Should().BeFalse();

        // Deve deletar as chaves da família
        _databaseMock.Verify(db => db.KeyDeleteAsync(familyKey, CommandFlags.None), Times.Once);
        _databaseMock.Verify(db => db.KeyDeleteAsync(tokenKey, CommandFlags.None), Times.Once);
    }
}
