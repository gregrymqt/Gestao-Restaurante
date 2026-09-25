using FluentAssertions;
using RestauranteInteligente.Infrastructure.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class RedisKeyHelperTests
{
    private readonly Guid _tenantId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    [Fact]
    public void BuildIdempotencyKey_DeveConterHashTagDoTenant()
    {
        var key = RedisKeyHelper.BuildIdempotencyKey(_tenantId, "msg-recarga-9988");
        key.Should().Be("{11111111-2222-3333-4444-555555555555}:idempotency:msg-recarga-9988");
    }

    [Fact]
    public void BuildLockKey_DeveConterHashTagDoTenant()
    {
        var key = RedisKeyHelper.BuildLockKey(_tenantId, "estoque-insumo-42");
        key.Should().Be("{11111111-2222-3333-4444-555555555555}:lock:estoque-insumo-42");
    }

    [Fact]
    public void BuildCacheKey_DeveConterHashTagDoTenant()
    {
        var key = RedisKeyHelper.BuildCacheKey(_tenantId, "cardapio-ativo");
        key.Should().Be("{11111111-2222-3333-4444-555555555555}:cache:cardapio-ativo");
    }

    [Fact]
    public void BuildTenantStreamChannel_DeveConterHashTagDoTenant()
    {
        var channel = RedisKeyHelper.BuildTenantStreamChannel(_tenantId);
        channel.Should().Be("{11111111-2222-3333-4444-555555555555}:events:stream");
    }
}
