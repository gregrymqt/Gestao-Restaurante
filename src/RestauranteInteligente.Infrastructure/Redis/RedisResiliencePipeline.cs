using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;
using Polly.Timeout;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// Contrato para execução de operações Redis sob pipeline de resiliência (Circuit Breaker, Timeout e Retry).
/// </summary>
public interface IRedisResiliencePipeline
{
    ResiliencePipeline Pipeline { get; }
    Task<T> ExecuteAsync<T>(Func<CancellationToken, ValueTask<T>> action, CancellationToken ct = default);
    Task ExecuteAsync(Func<CancellationToken, ValueTask> action, CancellationToken ct = default);
}

/// <summary>
/// Implementação do pipeline de resiliência distribuído para o Redis utilizando Polly v8.
/// Protege o sistema contra exaustão de thread pool e falhas em cascata em momentos de indisponibilidade do Redis.
/// </summary>
public sealed class RedisResiliencePipeline : IRedisResiliencePipeline
{
    public ResiliencePipeline Pipeline { get; }

    public RedisResiliencePipeline(ILogger<RedisResiliencePipeline> logger)
    {
        Pipeline = new ResiliencePipelineBuilder()
            // 1. Timeout por operação individual
            .AddTimeout(new TimeoutStrategyOptions
            {
                Timeout = TimeSpan.FromSeconds(3),
                OnTimeout = args =>
                {
                    logger.LogWarning("Operação Redis sofreu timeout após {Timeout}.", args.Timeout);
                    return default;
                }
            })
            // 2. Retry com backoff exponencial para falhas transitórias de rede
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = 2,
                Delay = TimeSpan.FromMilliseconds(50),
                BackoffType = DelayBackoffType.Exponential,
                UseJitter = true,
                ShouldHandle = new PredicateBuilder().Handle<RedisException>().Handle<TimeoutRejectedException>(),
                OnRetry = args =>
                {
                    logger.LogWarning("Tentativa {Attempt} de operação Redis falhou. Retentando em {Delay}ms...",
                        args.AttemptNumber, args.RetryDelay.TotalMilliseconds);
                    return default;
                }
            })
            // 3. Circuit Breaker para evitar tempestade de requisições sobre Redis inoperante
            .AddCircuitBreaker(new CircuitBreakerStrategyOptions
            {
                FailureRatio = 0.5,
                SamplingDuration = TimeSpan.FromSeconds(10),
                MinimumThroughput = 5,
                BreakDuration = TimeSpan.FromSeconds(30),
                ShouldHandle = new PredicateBuilder().Handle<RedisException>().Handle<TimeoutRejectedException>(),
                OnOpened = args =>
                {
                    logger.LogCritical("CIRCUIT BREAKER REDIS ABERTO por {BreakDuration} devido a falhas consecutivas!", args.BreakDuration);
                    return default;
                },
                OnClosed = _ =>
                {
                    logger.LogInformation("Circuit Breaker Redis fechado. Operações restabelecidas com normalidade.");
                    return default;
                },
                OnHalfOpened = _ =>
                {
                    logger.LogInformation("Circuit Breaker Redis em estado Half-Open (testando conectividade)...");
                    return default;
                }
            })
            .Build();
    }

    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, ValueTask<T>> action, CancellationToken ct = default)
    {
        return await Pipeline.ExecuteAsync(action, ct);
    }

    public async Task ExecuteAsync(Func<CancellationToken, ValueTask> action, CancellationToken ct = default)
    {
        await Pipeline.ExecuteAsync(action, ct);
    }
}
