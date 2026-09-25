using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;
using RestauranteInteligente.Infrastructure.Security;

namespace RestauranteInteligente.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Infraestrutura Redis
        services.Configure<RedisOptions>(configuration.GetSection(RedisOptions.SectionName));
        services.AddSingleton<IRedisConnectionFactory, RedisConnectionFactory>();
        services.AddSingleton<IIdempotencyService, RedisIdempotencyService>();
        services.AddSingleton<IDistributedLockService, RedisDistributedLockService>();
        services.AddSingleton<ISseEventStreamService, RedisStreamService>();
        services.AddSingleton<ICacheService, RedisCacheService>();

        // 2. Segurança: Blacklist, Rate Limiter e Refresh Tokens no Redis
        services.AddSingleton<ITokenBlacklistService, RedisTokenBlacklistService>();
        services.AddSingleton<IRateLimiterService, RedisSlidingWindowRateLimiter>();
        services.AddSingleton<IRefreshTokenService, RedisRefreshTokenService>();

        // 3. Segurança: Validador de Assinatura de Webhooks HMAC
        services.AddSingleton<IWebhookSignatureValidator, WebhookSignatureValidator>();

        // 4. Segurança: Emissor e Validador JWT
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var keyBytes = Encoding.UTF8.GetBytes(jwtOptions.Key);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false; // Permitido em ambiente local/dev
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(15)
            };

            // Interceptação de segurança: Rejeição de tokens contidos na Blacklist do Redis
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                    if (!string.IsNullOrWhiteSpace(jti))
                    {
                        var blacklistService = context.HttpContext.RequestServices.GetRequiredService<ITokenBlacklistService>();
                        if (await blacklistService.IsTokenRevokedAsync(jti, context.HttpContext.RequestAborted))
                        {
                            context.Fail("Token JWT revogado e bloqueado na Blacklist.");
                        }
                    }
                }
            };
        });

        services.AddAuthorization();

        return services;
    }
}
