using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RestauranteInteligente.Infrastructure;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class FailFastStartupTests
{
    private static Dictionary<string, string?> CreateBaseSettings() => new(StringComparer.OrdinalIgnoreCase)
    {
        { "POSTGRES_USER", "postgres" },
        { "POSTGRES_PASSWORD", "postgres_seguro_123" },
        { "POSTGRES_DB", "restaurante_db" },
        { "POSTGRES_HOST", "127.0.0.1" },
        { "POSTGRES_PORT", "5432" },
        { "REDIS_HOST", "127.0.0.1" },
        { "REDIS_PORT", "6379" },
        { "REDIS_PASSWORD", "redis_seguro_123" },
        { "RABBITMQ_HOST", "127.0.0.1" },
        { "RABBITMQ_PORT", "5672" },
        { "RABBITMQ_USER", "guest" },
        { "RABBITMQ_PASSWORD", "guest" },
        { "INTERNAL_SERVICE_API_KEY", "dev_internal_key_test_12345" },
        { "MERCADO_PAGO_WEBHOOK_SECRET", "dev_mp_webhook_secret_test_12345" }
    };

    [Fact]
    public void AddInfrastructureServices_QuandoJwtKeyAusenteOuCurta_DeveLancarInvalidOperationExceptionFailFast()
    {
        var inMemorySettings = CreateBaseSettings();
        inMemorySettings["Jwt:Key"] = "chave_curta"; // menos de 32 caracteres
        inMemorySettings["Jwt:Issuer"] = "RestauranteInteligente";
        inMemorySettings["Jwt:Audience"] = "RestauranteInteligente.App";

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var services = new ServiceCollection();

        var act = () => services.AddInfrastructureServices(configuration);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*VIOLAÇÃO CRÍTICA DE SEGURANÇA (Fail-Fast)*");
    }

    [Fact]
    public void AddInfrastructureServices_QuandoEmProducaoESemInternalServiceApiKey_DeveLancarInvalidOperationException()
    {
        var inMemorySettings = CreateBaseSettings();
        inMemorySettings["ENVIRONMENT"] = "production";
        inMemorySettings["Jwt:Key"] = "UmaChaveValidaComMaisDe32CaracteresParaProducao2026!";
        inMemorySettings["Jwt:Issuer"] = "RestauranteInteligente";
        inMemorySettings["Jwt:Audience"] = "RestauranteInteligente.App";
        inMemorySettings["Security:InternalServiceApiKey"] = ""; // VAZIA EM PRODUÇÃO
        inMemorySettings["INTERNAL_SERVICE_API_KEY"] = "";

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var services = new ServiceCollection();

        var act = () => services.AddInfrastructureServices(configuration);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*chave interna de serviço*");
    }

    [Fact]
    public void AddInfrastructureServices_QuandoConfiguracaoValida_DeveRegistrarServicosComSucesso()
    {
        var inMemorySettings = CreateBaseSettings();
        inMemorySettings["ENVIRONMENT"] = "development";
        inMemorySettings["Jwt:Key"] = "UmaChaveValidaComMaisDe32CaracteresParaDesenvolvimento2026!";
        inMemorySettings["Jwt:Issuer"] = "RestauranteInteligente";
        inMemorySettings["Jwt:Audience"] = "RestauranteInteligente.App";
        inMemorySettings["Security:InternalServiceApiKey"] = "dev_secret_key_12345";
        inMemorySettings["Security:MercadoPagoWebhookSecret"] = "mp_secret_12345";

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var services = new ServiceCollection();

        var act = () => services.AddInfrastructureServices(configuration);

        act.Should().NotThrow();
    }
}
