using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Infrastructure.Redis;
using StackExchange.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RedisIdempotencyServiceTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Mock<IRedisConnectionFactory> _factoryMock;
    private readonly Mock<IDatabase> _databaseMock;
    private readonly RedisIdempotencyService _service;

    public RedisIdempotencyServiceTests()
    {
        _factoryMock = new Mock<IRedisConnectionFactory>();
        _databaseMock = new Mock<IDatabase>();
        _factoryMock.Setup(f => f.GetDatabase()).Returns(_databaseMock.Object);

        _service = new RedisIdempotencyService(
            _factoryMock.Object,
            NullLogger<RedisIdempotencyService>.Instance
        );
    }

    [Fact]
    public async Task TryAcquireAsync_QuandoChaveNaoExiste_DeveRetornarTrue()
    {
        var expectedKey = RedisKeyHelper.BuildIdempotencyKey(_tenantId, "operacao-123");

        _databaseMock.Setup(db => db.StringSetAsync(
            expectedKey,
            "PROCESSING",
            It.IsAny<TimeSpan?>(),
            When.NotExists,
            CommandFlags.None
        )).ReturnsAsync(true);

        var result = await _service.TryAcquireAsync(_tenantId, "operacao-123", TimeSpan.FromMinutes(5));

        result.Should().BeTrue();
    }

    [Fact]
    public async Task TryAcquireAsync_QuandoChaveJaExiste_DeveRetornarFalse()
    {
        var expectedKey = RedisKeyHelper.BuildIdempotencyKey(_tenantId, "operacao-123");

        _databaseMock.Setup(db => db.StringSetAsync(
            expectedKey,
            "PROCESSING",
            It.IsAny<TimeSpan?>(),
            When.NotExists,
            CommandFlags.None
        )).ReturnsAsync(false);

        var result = await _service.TryAcquireAsync(_tenantId, "operacao-123", TimeSpan.FromMinutes(5));

        result.Should().BeFalse();
    }

    [Fact]
    public async Task MarkCompletedAsync_DeveDefinirEstadoComoCompleted()
    {
        var expectedKey = RedisKeyHelper.BuildIdempotencyKey(_tenantId, "operacao-123");

        await _service.MarkCompletedAsync(_tenantId, "operacao-123", TimeSpan.FromHours(24));

        _databaseMock.Verify(db => db.StringSetAsync(
            expectedKey,
            "COMPLETED",
            TimeSpan.FromHours(24),
            When.Always,
            CommandFlags.None
        ), Times.Once);
    }

    [Fact]
    public async Task ReleaseAsync_DeveDeletarChaveNoRedis()
    {
        var expectedKey = RedisKeyHelper.BuildIdempotencyKey(_tenantId, "operacao-123");

        await _service.ReleaseAsync(_tenantId, "operacao-123");

        _databaseMock.Verify(db => db.KeyDeleteAsync(
            expectedKey,
            CommandFlags.None
        ), Times.Once);
    }
}
