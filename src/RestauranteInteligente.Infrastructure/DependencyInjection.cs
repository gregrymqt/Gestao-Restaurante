using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;
using RestauranteInteligente.Infrastructure.Security;

namespace RestauranteInteligente.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Infraestrutura Redis & Resiliência (Polly v8)
        services.Configure<RedisOptions>(configuration.GetSection(RedisOptions.SectionName));
        services.AddSingleton<IRedisConnectionFactory, RedisConnectionFactory>();
        services.AddSingleton<IRedisResiliencePipeline, RedisResiliencePipeline>();
        services.AddSingleton<IIdempotencyService, RedisIdempotencyService>();
        services.AddSingleton<IDistributedLockService, RedisDistributedLockService>();
        services.AddSingleton<ISseEventStreamService, RedisStreamService>();
        services.AddSingleton<ICacheService, RedisCacheService>();

        // 2. Segurança: Opções e Chaves Internas
        services.Configure<SecurityOptions>(configuration.GetSection(SecurityOptions.SectionName));
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IAuthUserService, InMemoryAuthUserService>();

        // 3. Segurança: Blacklist, Rate Limiter e Refresh Tokens no Redis
        services.AddSingleton<ITokenBlacklistService, RedisTokenBlacklistService>();
        services.AddSingleton<IRateLimiterService, RedisSlidingWindowRateLimiter>();
        services.AddSingleton<IRefreshTokenService, RedisRefreshTokenService>();

        // 4. Segurança: Validador de Assinatura de Webhooks HMAC
        services.AddSingleton<IWebhookSignatureValidator, WebhookSignatureValidator>();

        // 5. Segurança: Emissor e Validador JWT com Validação Fail-Fast
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        ValidateSecurityConfiguration(jwtOptions, configuration);

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

            // Interceptação de segurança: Rejeição de tokens contidos na Blacklist do Redis sob pipeline de resiliência
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                    if (!string.IsNullOrWhiteSpace(jti))
                    {
                        var blacklistService = context.HttpContext.RequestServices.GetRequiredService<ITokenBlacklistService>();
                        var resiliencePipeline = context.HttpContext.RequestServices.GetService<IRedisResiliencePipeline>();

                        bool isRevoked = false;
                        if (resiliencePipeline != null)
                        {
                            try
                            {
                                isRevoked = await resiliencePipeline.ExecuteAsync(
                                    ct => new ValueTask<bool>(blacklistService.IsTokenRevokedAsync(jti, ct)),
                                    context.HttpContext.RequestAborted
                                );
                            }
                            catch (Exception ex)
                            {
                                var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("JwtSecurity");
                                logger.LogError(ex, "Falha ou Circuit Breaker aberto ao consultar Blacklist do Redis para o JTI '{Jti}'.", jti);
                            }
                        }
                        else
                        {
                            isRevoked = await blacklistService.IsTokenRevokedAsync(jti, context.HttpContext.RequestAborted);
                        }

                        if (isRevoked)
                        {
                            context.Fail("Token JWT revogado e bloqueado na Blacklist.");
                        }
                    }
                }
            };
        });

        // 6. Autorização com Modelo Deny-by-Default (FallbackPolicy)
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        });

        return services;
    }

    private static void ValidateSecurityConfiguration(JwtOptions jwtOptions, IConfiguration configuration)
    {
        if (string.IsNullOrWhiteSpace(jwtOptions.Key) || jwtOptions.Key.Length < 32)
        {
            throw new InvalidOperationException(
                "VIOLAÇÃO CRÍTICA DE SEGURANÇA (Fail-Fast): A chave 'Jwt:Key' deve conter no mínimo 32 caracteres (256 bits). Forneça uma chave segura via variável de ambiente JWT__KEY.");
        }

        var isProduction = string.Equals(configuration["ENVIRONMENT"], "production", StringComparison.OrdinalIgnoreCase);
        if (isProduction && jwtOptions.Key.Contains("ChaveSecretaUltraSeguraRestauranteInteligente2026!#@$"))
        {
            throw new InvalidOperationException(
                "VIOLAÇÃO CRÍTICA DE SEGURANÇA: Chave JWT default de exemplo detectada em ambiente de produção.");
        }

        var securitySection = configuration.GetSection(SecurityOptions.SectionName);
        var apiKey = securitySection[nameof(SecurityOptions.InternalServiceApiKey)];
        if (isProduction && string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "VIOLAÇÃO CRÍTICA DE SEGURANÇA: A chave interna de serviço ('Security:InternalServiceApiKey') é mandatória em produção.");
        }
    }
}
