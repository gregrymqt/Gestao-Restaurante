// ==============================================================================
// Manual Canónico de Backend: ASP.NET Core (.NET 9 / C# 13)
// Integrações HTTP Externas Resilientes (Microsoft.Extensions.Http.Resilience / Polly v8)
// ==============================================================================

using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;
using RestauranteInteligente.Application.Contracts.Messaging;

namespace RestauranteInteligente.Application.Common.Interfaces;

public interface IWeatherService
{
    Task<ParametroMeteorologicoPayload?> ObterPrevisaoClimaticaAsync(
        decimal latitude, 
        decimal longitude, 
        DateOnly data, 
        CancellationToken cancellationToken = default);
}

namespace RestauranteInteligente.Infrastructure.Integrations;

using RestauranteInteligente.Application.Common.Interfaces;

public sealed class WeatherClient : IWeatherService
{
    private readonly HttpClient _httpClient;

    public WeatherClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ParametroMeteorologicoPayload?> ObterPrevisaoClimaticaAsync(
        decimal latitude, 
        decimal longitude, 
        DateOnly data, 
        CancellationToken cancellationToken = default)
    {
        var url = $"weather?lat={latitude}&lon={longitude}&date={data:yyyy-MM-dd}";
        return await _httpClient.GetFromJsonAsync<ParametroMeteorologicoPayload>(url, cancellationToken);
    }
}

public static class WeatherClientServiceCollectionExtensions
{
    public static IServiceCollection AddWeatherClientInfrastructure(this IServiceCollection services)
    {
        services.AddHttpClient<IWeatherService, WeatherClient>(client =>
        {
            client.BaseAddress = new Uri("https://api.weatherprovider.com/v1/");
            client.Timeout = TimeSpan.FromSeconds(20);
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        })
        // Pipeline de Resiliência Padronizado em 5 Camadas
        .AddStandardResilienceHandler(options =>
        {
            // 1. Limitador de Taxa de Requisições
            options.RateLimiter.Name = "ClimaApiRateLimiter";

            // 2. Tempo Limite Total da Operação
            options.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(30);

            // 3. Política de Retentativas com Jitter Pseudoaleatório
            options.Retry.MaxRetryAttempts = 3;
            options.Retry.BackoffType = DelayBackoffType.Exponential;
            options.Retry.UseJitter = true;
            options.Retry.Delay = TimeSpan.FromSeconds(2);
            options.Retry.ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .HandleResult(r => r.StatusCode == HttpStatusCode.RequestTimeout ||
                                   r.StatusCode == HttpStatusCode.ServiceUnavailable ||
                                   r.StatusCode == HttpStatusCode.GatewayTimeout);

            // 4. Disjuntor de Circuito (Circuit Breaker)
            options.CircuitBreaker.FailureRatio = 0.5;
            options.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(30);
            options.CircuitBreaker.MinimumThroughput = 8;
            options.CircuitBreaker.BreakDuration = TimeSpan.FromSeconds(45);

            // 5. Tempo Limite por Tentativa Individual
            options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(5);
        });

        return services;
    }
}
