using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using MassTransit;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Infrastructure.Messaging;
using RestauranteInteligente.Infrastructure.Messaging.Consumers;
using RestauranteInteligente.Infrastructure.Persistence;
using RestauranteInteligente.Infrastructure.Persistence.Interceptors;
using RestauranteInteligente.Infrastructure.Persistence.Repositories;
using RestauranteInteligente.Infrastructure.ExternalServices.Weather;
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
        services.AddScoped<IAuthUserService, EfAuthUserService>();

        // 3. Segurança: Blacklist, Rate Limiter e Refresh Tokens no Redis
        services.AddSingleton<ITokenBlacklistService, RedisTokenBlacklistService>();
        services.AddSingleton<IRateLimiterService, RedisSlidingWindowRateLimiter>();
        services.AddSingleton<IRefreshTokenService, RedisRefreshTokenService>();

        // 4. Segurança: Emissor e Validador JWT com Validação Fail-Fast
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

        // 7. Persistência PostgreSQL 16 com EF Core e Interceptor RLS
        services.AddScoped<PostgresRlsTransactionInterceptor>();
        services.AddScoped<IInsumoRepository, InsumoRepository>();
        services.AddScoped<IProdutoRepository, ProdutoRepository>();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddDbContextPool<AppDbContext>((sp, options) =>
            {
                var interceptor = sp.GetRequiredService<PostgresRlsTransactionInterceptor>();
                options.UseNpgsql(connectionString, npgsql =>
                {
                    npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                    npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
                })
                .AddInterceptors(interceptor)
                .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            });

            services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        }

        // 8. Mensageria RabbitMQ com MassTransit e Serialização Raw JSON (interoperável com Python Pydantic V2)
        services.AddMassTransit(x =>
        {
            x.AddConsumer<PrevisaoDemandaConcluidaConsumer>();

            x.UsingRabbitMq((context, cfg) =>
            {
                var rabbitHost = configuration["RabbitMQ:Host"] ?? "localhost";
                var rabbitUser = configuration["RabbitMQ:Username"] ?? "guest";
                var rabbitPass = configuration["RabbitMQ:Password"] ?? "guest";

                cfg.Host(rabbitHost, "/", h =>
                {
                    h.Username(rabbitUser);
                    h.Password(rabbitPass);
                });

                // CLÁUSULA INEGOCIÁVEL: Serialização Raw JSON pura para interoperabilidade total com Python Pydantic V2
                cfg.UseRawJsonSerializer();

                // Mapeia publicação do evento para a fila/exchange previsao.demanda.solicitada
                cfg.Message<PrevisaoDemandaSolicitadaEvent>(m => m.SetEntityName("previsao.demanda.solicitada"));

                // Endpoint receptor do resultado processado pelo Worker Python
                cfg.ReceiveEndpoint("previsao.demanda.concluida", e =>
                {
                    e.ConfigureConsumer<PrevisaoDemandaConcluidaConsumer>(context);
                });
            });
        });

        services.AddScoped<IEventPublisher, MassTransitEventPublisher>();

        // 9. Cliente Meteorológico Externo (Open-Meteo) com Timeout e Resiliência
        services.AddHttpClient<IWeatherClient, OpenMeteoWeatherClient>(client =>
        {
            client.BaseAddress = new Uri("https://api.open-meteo.com/");
            client.Timeout = TimeSpan.FromSeconds(5);
        })
        .AddStandardResilienceHandler(options =>
        {
            options.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(5);
            options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(2);
            options.Retry.MaxRetryAttempts = 3;
            options.Retry.Delay = TimeSpan.FromMilliseconds(300);
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
