using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Infrastructure.Redis;
using StackExchange.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RedisCacheServiceTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Mock<IRedisConnectionFactory> _factoryMock;
    private readonly Mock<IDatabase> _databaseMock;
    private readonly RedisCacheService _service;

    public RedisCacheServiceTests()
    {
        _factoryMock = new Mock<IRedisConnectionFactory>();
        _databaseMock = new Mock<IDatabase>();
        _factoryMock.Setup(f => f.GetDatabase()).Returns(_databaseMock.Object);

        _service = new RedisCacheService(
            _factoryMock.Object,
            NullLogger<RedisCacheService>.Instance
        );
    }

    private sealed record TestItem(string Nome, decimal Preco);

    [Fact]
    public async Task SetAsync_DeveArmazenarJsonComChaveCompostaDoTenant()
    {
        var expectedKey = RedisKeyHelper.BuildCacheKey(_tenantId, "item-1");
        var item = new TestItem("Hamburguer Artesanal", 35.50m);

        await _service.SetAsync(_tenantId, "item-1", item, TimeSpan.FromMinutes(10));

        _databaseMock.Verify(db => db.StringSetAsync(
            expectedKey,
            It.Is<RedisValue>(v => v.ToString().Contains("Hamburguer Artesanal") && v.ToString().Contains("35.50")),
            TimeSpan.FromMinutes(10),
            When.Always,
            CommandFlags.None
        ), Times.Once);
    }

    [Fact]
    public async Task GetAsync_QuandoChaveExiste_DeveDesserializarObjeto()
    {
        var expectedKey = RedisKeyHelper.BuildCacheKey(_tenantId, "item-1");
        var json = "{\"Nome\":\"Hamburguer Artesanal\",\"Preco\":35.50}";

        _databaseMock.Setup(db => db.StringGetAsync(expectedKey, CommandFlags.None))
            .ReturnsAsync(json);

        var result = await _service.GetAsync<TestItem>(_tenantId, "item-1");

        result.Should().NotBeNull();
        result!.Nome.Should().Be("Hamburguer Artesanal");
        result.Preco.Should().Be(35.50m);
    }

    [Fact]
    public async Task GetAsync_QuandoChaveNaoExiste_DeveRetornarNull()
    {
        var expectedKey = RedisKeyHelper.BuildCacheKey(_tenantId, "item-inexistente");

        _databaseMock.Setup(db => db.StringGetAsync(expectedKey, CommandFlags.None))
            .ReturnsAsync(RedisValue.Null);

        var result = await _service.GetAsync<TestItem>(_tenantId, "item-inexistente");

        result.Should().BeNull();
    }
}
