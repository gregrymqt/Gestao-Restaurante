using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Infrastructure.Redis;
using StackExchange.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RedisDistributedLockServiceTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Mock<IRedisConnectionFactory> _factoryMock;
    private readonly Mock<IDatabase> _databaseMock;
    private readonly RedisDistributedLockService _service;

    public RedisDistributedLockServiceTests()
    {
        _factoryMock = new Mock<IRedisConnectionFactory>();
        _databaseMock = new Mock<IDatabase>();
        _factoryMock.Setup(f => f.GetDatabase()).Returns(_databaseMock.Object);

        _service = new RedisDistributedLockService(
            _factoryMock.Object,
            NullLogger<RedisDistributedLockService>.Instance
        );
    }

    [Fact]
    public async Task TryAcquireLockAsync_QuandoLockDisponivel_DeveRetornarDisposableEExecutarLuaAoDescartar()
    {
        var expectedKey = RedisKeyHelper.BuildLockKey(_tenantId, "insumo-99");

        _databaseMock.Setup(db => db.StringSetAsync(
            expectedKey,
            It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan?>(),
            When.NotExists,
            CommandFlags.None
        )).ReturnsAsync(true);

        _databaseMock.Setup(db => db.ScriptEvaluateAsync(
            It.IsAny<string>(),
            It.IsAny<RedisKey[]>(),
            It.IsAny<RedisValue[]>(),
            CommandFlags.None
        )).ReturnsAsync(RedisResult.Create(1));

        var lockHandle = await _service.TryAcquireLockAsync(
            _tenantId,
            "insumo-99",
            TimeSpan.FromSeconds(30),
            TimeSpan.FromSeconds(1)
        );

        lockHandle.Should().NotBeNull();

        // Ao dar dispose, deve executar o script Lua
        await lockHandle!.DisposeAsync();

        _databaseMock.Verify(db => db.ScriptEvaluateAsync(
            It.Is<string>(s => s.Contains("redis.call('get', KEYS[1]) == ARGV[1]")),
            It.Is<RedisKey[]>(keys => keys.Length == 1 && keys[0] == expectedKey),
            It.Is<RedisValue[]>(values => values.Length == 1),
            CommandFlags.None
        ), Times.Once);
    }

    [Fact]
    public async Task TryAcquireLockAsync_QuandoTimeoutEsgotado_DeveRetornarNull()
    {
        var expectedKey = RedisKeyHelper.BuildLockKey(_tenantId, "insumo-ocupado");

        _databaseMock.Setup(db => db.StringSetAsync(
            expectedKey,
            It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan?>(),
            When.NotExists,
            CommandFlags.None
        )).ReturnsAsync(false);

        var lockHandle = await _service.TryAcquireLockAsync(
            _tenantId,
            "insumo-ocupado",
            TimeSpan.FromSeconds(30),
            TimeSpan.FromMilliseconds(50)
        );

        lockHandle.Should().BeNull();
    }
}
