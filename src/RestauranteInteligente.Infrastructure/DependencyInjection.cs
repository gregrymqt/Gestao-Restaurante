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
using RestauranteInteligente.Infrastructure.Configuration;
using RestauranteInteligente.Infrastructure.Messaging;
using RestauranteInteligente.Infrastructure.Messaging.Consumers;
using RestauranteInteligente.Infrastructure.Persistence;
using RestauranteInteligente.Infrastructure.Persistence.Interceptors;
using RestauranteInteligente.Infrastructure.Persistence.Repositories;
using RestauranteInteligente.Infrastructure.Persistence.UnitOfWork;
using RestauranteInteligente.Infrastructure.ExternalServices.Weather;
using RestauranteInteligente.Infrastructure.Redis;
using RestauranteInteligente.Infrastructure.Security;

namespace RestauranteInteligente.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration? configuration = null,
        IAppEnvSettings? customEnv = null)
    {
        // Resolução e validação estrita Fail-Fast das variáveis de ambiente a partir do .env
        IAppEnvSettings env;
        if (customEnv != null)
        {
            env = customEnv;
        }
        else
        {
            var hasConfigOverrides = configuration != null && configuration.AsEnumerable().Any(k => !string.IsNullOrEmpty(k.Key));
            if (hasConfigOverrides)
            {
                var envFilePath = DotEnvLoader.FindDotEnvFile();
                var dict = envFilePath != null && File.Exists(envFilePath)
                    ? DotEnvLoader.ParseFile(envFilePath)
                    : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                var merged = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
                foreach (var kv in dict)
                {
                    merged[kv.Key] = kv.Value;
                }

                DotEnvLoader.MergeOverrides(merged, configuration!.AsEnumerable().Select(x => new KeyValuePair<string, string?>(x.Key, x.Value)));

                env = DotEnvLoader.LoadFromDictionary(merged, envFilePath);
            }
            else
            {
                env = DotEnvLoader.Load();
            }
        }

        // 1. Registro Centralizado de Interfaces de Configuração Tipada
        services.AddSingleton<IAppEnvSettings>(env);
        services.AddSingleton<IDatabaseConfig>(env.Database);
        services.AddSingleton<IRedisConfig>(env.Redis);
        services.AddSingleton<IRabbitMqConfig>(env.RabbitMq);
        services.AddSingleton<IJwtConfig>(env.Jwt);
        services.AddSingleton<ISecurityConfig>(env.Security);

        // Suporte retrocompatível via IOptions
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(new RedisOptions
        {
            Host = env.Redis.Host,
            Port = env.Redis.Port,
            Password = env.Redis.Password,
            Database = env.Redis.Database,
            ConnectTimeoutMs = env.Redis.ConnectTimeoutMs,
            SyncTimeoutMs = env.Redis.SyncTimeoutMs,
            ConnectRetry = env.Redis.ConnectRetry,
            AbortOnConnectFail = env.Redis.AbortOnConnectFail
        }));

        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            Key = env.Jwt.Key,
            Issuer = env.Jwt.Issuer,
            Audience = env.Jwt.Audience,
            ExpirationMinutes = env.Jwt.ExpirationMinutes,
            RefreshTokenExpirationDays = env.Jwt.RefreshTokenExpirationDays
        }));

        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(new SecurityOptions
        {
            InternalServiceApiKey = env.Security.InternalServiceApiKey
        }));

        // 2. Infraestrutura Redis & Resiliência (Polly v8)
        services.AddSingleton<IRedisConnectionFactory, RedisConnectionFactory>();
        services.AddSingleton<IRedisResiliencePipeline, RedisResiliencePipeline>();
        services.AddSingleton<IIdempotencyService, RedisIdempotencyService>();
        services.AddSingleton<IDistributedLockService, RedisDistributedLockService>();
        services.AddSingleton<ISseEventStreamService, RedisStreamService>();
        services.AddSingleton<ICacheService, RedisCacheService>();

        // 3. Segurança: Chaves e Usuários
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IAuthUserService, EfAuthUserService>();
        services.AddSingleton<ITokenBlacklistService, RedisTokenBlacklistService>();
        services.AddSingleton<IRateLimiterService, RedisSlidingWindowRateLimiter>();
        services.AddSingleton<IRefreshTokenService, RedisRefreshTokenService>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        var keyBytes = Encoding.UTF8.GetBytes(env.Jwt.Key);

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
                ValidIssuer = env.Jwt.Issuer,
                ValidateAudience = true,
                ValidAudience = env.Jwt.Audience,
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

        // 4. Autorização com Modelo Deny-by-Default (FallbackPolicy)
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        });

        // 5. Persistência PostgreSQL 16 com EF Core e Interceptor RLS
        services.AddScoped<PostgresRlsTransactionInterceptor>();
        services.AddScoped<IInsumoRepository, InsumoRepository>();
        services.AddScoped<IProdutoRepository, ProdutoRepository>();
        services.AddScoped<IVendaRepository, VendaRepository>();
        services.AddScoped<IFechamentoCaixaRepository, FechamentoCaixaRepository>();
        services.AddScoped<IDadosClimaticosRepository, DadosClimaticosRepository>();
        services.AddScoped<IPrevisaoRepository, PrevisaoRepository>();
        services.AddScoped<IRestauranteRepository, RestauranteRepository>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IAssinaturaRepository, AssinaturaRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        var connectionString = env.Database.ConnectionString;
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
            })
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // 6. Mensageria RabbitMQ com MassTransit e Serialização Raw JSON (interoperável com Python Pydantic V2)
        services.AddMassTransit(x =>
        {
            x.AddConsumer<PrevisaoDemandaConcluidaConsumer>();

            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(env.RabbitMq.Host, "/", h =>
                {
                    h.Username(env.RabbitMq.Username);
                    h.Password(env.RabbitMq.Password);
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

        // 7. Cliente Meteorológico Externo (Open-Meteo) com Timeout e Resiliência
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
}
