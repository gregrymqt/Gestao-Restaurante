namespace RestauranteInteligente.Application.Common.Interfaces;

/// <summary>
/// Dados meteorológicos consolidados para uma data alvo específica.
/// </summary>
public sealed record WeatherData(decimal Temperatura, decimal Umidade, decimal Precipitacao);

/// <summary>
/// Contrato de integração meteorológica externa resiliente.
/// </summary>
public interface IWeatherClient
{
    Task<WeatherData> ObterPrevisaoClimaAsync(decimal latitude, decimal longitude, DateOnly dataAlvo, CancellationToken ct = default);
}
