using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RestauranteInteligente.Infrastructure;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class FailFastStartupTests
{
    [Fact]
    public void AddInfrastructureServices_QuandoJwtKeyAusenteOuCurta_DeveLancarInvalidOperationExceptionFailFast()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Key", "chave_curta" }, // menos de 32 caracteres
            { "Jwt:Issuer", "RestauranteInteligente" },
            { "Jwt:Audience", "RestauranteInteligente.App" }
        };

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
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "ENVIRONMENT", "production" },
            { "Jwt:Key", "UmaChaveValidaComMaisDe32CaracteresParaProducao2026!" },
            { "Jwt:Issuer", "RestauranteInteligente" },
            { "Jwt:Audience", "RestauranteInteligente.App" },
            { "Security:InternalServiceApiKey", "" } // VAZIA EM PRODUÇÃO
        };

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
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "ENVIRONMENT", "development" },
            { "Jwt:Key", "UmaChaveValidaComMaisDe32CaracteresParaDesenvolvimento2026!" },
            { "Jwt:Issuer", "RestauranteInteligente" },
            { "Jwt:Audience", "RestauranteInteligente.App" },
            { "Security:InternalServiceApiKey", "dev_secret_key_12345" },
            { "Security:MercadoPagoWebhookSecret", "mp_secret_12345" }
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var services = new ServiceCollection();

        var act = () => services.AddInfrastructureServices(configuration);

        act.Should().NotThrow();
    }
}
