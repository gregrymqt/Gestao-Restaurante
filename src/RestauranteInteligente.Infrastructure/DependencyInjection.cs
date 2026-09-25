using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;

namespace RestauranteInteligente.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddRedisInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RedisOptions>(configuration.GetSection(RedisOptions.SectionName));

        services.AddSingleton<IRedisConnectionFactory, RedisConnectionFactory>();
        services.AddSingleton<IIdempotencyService, RedisIdempotencyService>();
        services.AddSingleton<IDistributedLockService, RedisDistributedLockService>();
        services.AddSingleton<ISseEventStreamService, RedisStreamService>();
        services.AddSingleton<ICacheService, RedisCacheService>();

        return services;
    }
}
