using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Infrastructure.Redis;
using RestauranteInteligente.Infrastructure.Security;
using StackExchange.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RedisTokenBlacklistServiceTests
{
    private readonly Mock<IRedisConnectionFactory> _factoryMock;
    private readonly Mock<IDatabase> _databaseMock;
    private readonly RedisTokenBlacklistService _service;

    public RedisTokenBlacklistServiceTests()
    {
        _factoryMock = new Mock<IRedisConnectionFactory>();
        _databaseMock = new Mock<IDatabase>();
        _factoryMock.Setup(f => f.GetDatabase()).Returns(_databaseMock.Object);

        _service = new RedisTokenBlacklistService(
            _factoryMock.Object,
            NullLogger<RedisTokenBlacklistService>.Instance
        );
    }

    [Fact]
    public async Task RevokeTokenAsync_QuandoTtlPositivo_DeveGravarNaBlacklistDoRedis()
    {
        var jti = "jwt-unique-id-9988";
        var ttl = TimeSpan.FromMinutes(45);
        var expectedKey = RedisKeyHelper.BuildBlacklistKey(jti);

        await _service.RevokeTokenAsync(jti, ttl);

        _databaseMock.Verify(db => db.StringSetAsync(
            expectedKey,
            "REVOKED",
            ttl,
            When.Always,
            CommandFlags.None
        ), Times.Once);
    }

    [Fact]
    public async Task RevokeTokenAsync_QuandoTtlExpirado_NaoDeveChamarRedis()
    {
        var jti = "jwt-expired-id";
        var ttl = TimeSpan.FromSeconds(-10);

        await _service.RevokeTokenAsync(jti, ttl);

        _databaseMock.Verify(db => db.StringSetAsync(
            It.IsAny<RedisKey>(),
            It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan?>(),
            It.IsAny<When>(),
            It.IsAny<CommandFlags>()
        ), Times.Never);
    }

    [Fact]
    public async Task IsTokenRevokedAsync_QuandoTokenConstaNaBlacklist_DeveRetornarTrue()
    {
        var jti = "jwt-revoked-token";
        var expectedKey = RedisKeyHelper.BuildBlacklistKey(jti);

        _databaseMock.Setup(db => db.KeyExistsAsync(expectedKey, CommandFlags.None))
            .ReturnsAsync(true);

        var isRevoked = await _service.IsTokenRevokedAsync(jti);

        isRevoked.Should().BeTrue();
    }

    [Fact]
    public async Task IsTokenRevokedAsync_QuandoTokenNaoConstaNaBlacklist_DeveRetornarFalse()
    {
        var jti = "jwt-valid-token";
        var expectedKey = RedisKeyHelper.BuildBlacklistKey(jti);

        _databaseMock.Setup(db => db.KeyExistsAsync(expectedKey, CommandFlags.None))
            .ReturnsAsync(false);

        var isRevoked = await _service.IsTokenRevokedAsync(jti);

        isRevoked.Should().BeFalse();
    }
}
