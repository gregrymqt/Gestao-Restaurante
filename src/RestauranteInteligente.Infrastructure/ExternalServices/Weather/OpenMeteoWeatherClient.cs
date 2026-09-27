using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Infrastructure.ExternalServices.Weather;

/// <summary>
/// Cliente HTTP resiliente para integração com a API pública do Open-Meteo.
/// Aplica resiliência via Polly, timeout e degradação graciosa com valores neutros em caso de falha externa.
/// </summary>
public sealed class OpenMeteoWeatherClient : IWeatherClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenMeteoWeatherClient> _logger;

    public OpenMeteoWeatherClient(HttpClient httpClient, ILogger<OpenMeteoWeatherClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<WeatherData> ObterPrevisaoClimaAsync(
        decimal latitude,
        decimal longitude,
        DateOnly dataAlvo,
        CancellationToken ct = default)
    {
        // Se as coordenadas forem 0 ou padrão não configurado, aplica fallback preventivo
        if (latitude == 0m && longitude == 0m)
        {
            _logger.LogWarning("Coordenadas geográficas não configuradas (0, 0). Assumindo valores meteorológicos neutros padrão.");
            return new WeatherData(Temperatura: 25.0m, Umidade: 60.0m, Precipitacao: 0.0m);
        }

        var dataStr = dataAlvo.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var latStr = latitude.ToString(CultureInfo.InvariantCulture);
        var lonStr = longitude.ToString(CultureInfo.InvariantCulture);

        var requestUri = $"v1/forecast?latitude={latStr}&longitude={lonStr}&hourly=temperature_2m,relative_humidity_2m,precipitation&start_date={dataStr}&end_date={dataStr}&timezone=auto";

        try
        {
            using var response = await _httpClient.GetAsync(requestUri, ct);
            response.EnsureSuccessStatusCode();

            var jsonContent = await response.Content.ReadAsStringAsync(ct);
            var weatherResponse = JsonSerializer.Deserialize<OpenMeteoForecastResponse>(jsonContent);

            if (weatherResponse?.Hourly == null ||
                weatherResponse.Hourly.Temperature2m.Count == 0 ||
                weatherResponse.Hourly.RelativeHumidity2m.Count == 0)
            {
                _logger.LogWarning("Resposta da API Open-Meteo vazia ou incompleta para data {DataAlvo}. Aplicando degradação graciosa.", dataAlvo);
                return new WeatherData(Temperatura: 25.0m, Umidade: 60.0m, Precipitacao: 0.0m);
            }

            var tempMedia = (decimal)weatherResponse.Hourly.Temperature2m.Average();
            var umidadeMedia = (decimal)weatherResponse.Hourly.RelativeHumidity2m.Average();
            var precipTotal = weatherResponse.Hourly.Precipitation.Count > 0
                ? (decimal)weatherResponse.Hourly.Precipitation.Sum()
                : 0.0m;

            var resultado = new WeatherData(
                Temperatura: Math.Round(tempMedia, 2),
                Umidade: Math.Clamp(Math.Round(umidadeMedia, 2), 0.0m, 100.0m),
                Precipitacao: Math.Max(0.0m, Math.Round(precipTotal, 2))
            );

            _logger.LogInformation(
                "Dados meteorológicos obtidos com sucesso do Open-Meteo para {DataAlvo}: Temp={Temp}°C, Umidade={Umid}%, Precip={Precip}mm.",
                dataAlvo, resultado.Temperatura, resultado.Umidade, resultado.Precipitacao);

            return resultado;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Falha ao consultar API Open-Meteo ({RequestUri}) para data {DataAlvo}. Aplicando degradação graciosa (valores padrão).",
                requestUri, dataAlvo);

            // CLÁUSULA: Degradação graciosa sem abortar operação de negócio
            return new WeatherData(Temperatura: 25.0m, Umidade: 60.0m, Precipitacao: 0.0m);
        }
    }

    private sealed class OpenMeteoForecastResponse
    {
        [JsonPropertyName("hourly")]
        public OpenMeteoHourlyData? Hourly { get; set; }
    }

    private sealed class OpenMeteoHourlyData
    {
        [JsonPropertyName("temperature_2m")]
        public List<double> Temperature2m { get; set; } = [];

        [JsonPropertyName("relative_humidity_2m")]
        public List<double> RelativeHumidity2m { get; set; } = [];

        [JsonPropertyName("precipitation")]
        public List<double> Precipitation { get; set; } = [];
    }
}
