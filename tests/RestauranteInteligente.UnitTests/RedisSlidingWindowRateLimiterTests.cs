using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Infrastructure.Redis;
using RestauranteInteligente.Infrastructure.Security;
using StackExchange.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RedisSlidingWindowRateLimiterTests
{
    private readonly Mock<IRedisConnectionFactory> _factoryMock;
    private readonly Mock<IDatabase> _databaseMock;
    private readonly RedisSlidingWindowRateLimiter _limiter;

    public RedisSlidingWindowRateLimiterTests()
    {
        _factoryMock = new Mock<IRedisConnectionFactory>();
        _databaseMock = new Mock<IDatabase>();
        _factoryMock.Setup(f => f.GetDatabase()).Returns(_databaseMock.Object);

        _limiter = new RedisSlidingWindowRateLimiter(
            _factoryMock.Object,
            NullLogger<RedisSlidingWindowRateLimiter>.Instance
        );
    }

    [Fact]
    public async Task CheckRateLimitAsync_QuandoDentroDoLimite_DeveRetornarIsAllowedTrue()
    {
        var clientKey = "ip:192.168.1.100";
        var expectedKey = RedisKeyHelper.BuildRateLimitKey(clientKey);

        // Retorno do script Lua: { 1 (permitido), 3 (contagem), 0 (retryAfterMs) }
        var scriptResponse = new RedisResult[]
        {
            RedisResult.Create(1),
            RedisResult.Create(3),
            RedisResult.Create(0)
        };

        _databaseMock.Setup(db => db.ScriptEvaluateAsync(
            It.IsAny<string>(),
            It.Is<RedisKey[]>(keys => keys.Length == 1 && keys[0] == expectedKey),
            It.IsAny<RedisValue[]>(),
            CommandFlags.None
        )).ReturnsAsync(RedisResult.Create(scriptResponse));

        var result = await _limiter.CheckRateLimitAsync(clientKey, maxRequests: 10, TimeSpan.FromMinutes(1));

        result.IsAllowed.Should().BeTrue();
        result.CurrentCount.Should().Be(3);
        result.Limit.Should().Be(10);
        result.RetryAfter.Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public async Task CheckRateLimitAsync_QuandoLimiteEstourado_DeveRetornarIsAllowedFalseComRetryAfter()
    {
        var clientKey = "ip:192.168.1.200";
        var expectedKey = RedisKeyHelper.BuildRateLimitKey(clientKey);

        // Retorno do script Lua: { 0 (bloqueado), 10 (contagem atual), 12500 (retryAfterMs) }
        var scriptResponse = new RedisResult[]
        {
            RedisResult.Create(0),
            RedisResult.Create(10),
            RedisResult.Create(12500)
        };

        _databaseMock.Setup(db => db.ScriptEvaluateAsync(
            It.IsAny<string>(),
            It.Is<RedisKey[]>(keys => keys.Length == 1 && keys[0] == expectedKey),
            It.IsAny<RedisValue[]>(),
            CommandFlags.None
        )).ReturnsAsync(RedisResult.Create(scriptResponse));

        var result = await _limiter.CheckRateLimitAsync(clientKey, maxRequests: 10, TimeSpan.FromMinutes(1));

        result.IsAllowed.Should().BeFalse();
        result.CurrentCount.Should().Be(10);
        result.RetryAfter.TotalMilliseconds.Should().Be(12500);
    }
}
