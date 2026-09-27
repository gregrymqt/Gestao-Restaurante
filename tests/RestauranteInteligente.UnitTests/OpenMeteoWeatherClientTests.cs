using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Protected;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Infrastructure.ExternalServices.Weather;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class OpenMeteoWeatherClientTests
{
    private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock = new();

    private OpenMeteoWeatherClient CreateClient(HttpMessageHandler handler)
    {
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.open-meteo.com/")
        };

        return new OpenMeteoWeatherClient(httpClient, NullLogger<OpenMeteoWeatherClient>.Instance);
    }

    [Fact]
    public async Task ObterPrevisaoClimaAsync_RespostaValida_DeveCalcularMediasESoma()
    {
        // Arrange
        var jsonResponse = """
        {
            "latitude": -23.55,
            "longitude": -46.63,
            "hourly": {
                "temperature_2m": [20.0, 22.0, 24.0, 26.0],
                "relative_humidity_2m": [50.0, 60.0, 70.0, 80.0],
                "precipitation": [0.0, 1.5, 0.5, 0.0]
            }
        }
        """;

        _httpMessageHandlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(jsonResponse)
            });

        var client = CreateClient(_httpMessageHandlerMock.Object);
        var dataAlvo = new DateOnly(2026, 9, 28);

        // Act
        var result = await client.ObterPrevisaoClimaAsync(-23.55m, -46.63m, dataAlvo);

        // Assert
        result.Should().NotBeNull();
        // Média de temperatura: (20+22+24+26)/4 = 23.0
        result.Temperatura.Should().Be(23.0m);
        // Média de umidade: (50+60+70+80)/4 = 65.0
        result.Umidade.Should().Be(65.0m);
        // Soma de precipitação: 0 + 1.5 + 0.5 + 0 = 2.0
        result.Precipitacao.Should().Be(2.0m);
    }

    [Fact]
    public async Task ObterPrevisaoClimaAsync_FalhaHttp_DeveAplicarDegradacaoGraciosaComValoresPadrao()
    {
        // Arrange
        _httpMessageHandlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("Erro de conexão com o servidor Open-Meteo"));

        var client = CreateClient(_httpMessageHandlerMock.Object);
        var dataAlvo = new DateOnly(2026, 9, 28);

        // Act
        var result = await client.ObterPrevisaoClimaAsync(-23.55m, -46.63m, dataAlvo);

        // Assert: Degradação graciosa para valores neutros
        result.Should().NotBeNull();
        result.Temperatura.Should().Be(25.0m);
        result.Umidade.Should().Be(60.0m);
        result.Precipitacao.Should().Be(0.0m);
    }

    [Fact]
    public async Task ObterPrevisaoClimaAsync_CoordenadasZero_DeveRetornarValoresPadraoSemChamarHttp()
    {
        // Arrange
        var client = CreateClient(_httpMessageHandlerMock.Object);
        var dataAlvo = new DateOnly(2026, 9, 28);

        // Act
        var result = await client.ObterPrevisaoClimaAsync(0m, 0m, dataAlvo);

        // Assert
        result.Should().NotBeNull();
        result.Temperatura.Should().Be(25.0m);
        result.Umidade.Should().Be(60.0m);
        result.Precipitacao.Should().Be(0.0m);

        _httpMessageHandlerMock.Protected()
            .Verify("SendAsync", Times.Never(), ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>());
    }
}
