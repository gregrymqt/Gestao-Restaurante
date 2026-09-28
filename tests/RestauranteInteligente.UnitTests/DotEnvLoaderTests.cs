using FluentAssertions;
using RestauranteInteligente.Infrastructure.Configuration;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class DotEnvLoaderTests
{
    [Fact]
    public void LoadFromDictionary_QuandoVariaveisObrigatoriasAusentes_DeveLancarEnvConfigurationExceptionComListaDeChaves()
    {
        var emptyDict = new Dictionary<string, string?>();

        var act = () => DotEnvLoader.LoadFromDictionary(emptyDict);

        act.Should().Throw<EnvConfigurationException>()
            .WithMessage("*VIOLAÇÃO CRÍTICA DE CONFIGURAÇÃO (Fail-Fast)*")
            .WithMessage("*POSTGRES_USER*")
            .WithMessage("*REDIS_PASSWORD*")
            .WithMessage("*RABBITMQ_HOST*")
            .WithMessage("*JWT_KEY*");
    }

    [Fact]
    public void LoadFromDictionary_QuandoJwtKeyMenorQue32Caracteres_DeveLancarExcecaoFailFast()
    {
        var dict = CreateValidDevDictionary();
        dict["JWT_KEY"] = "chave_muito_curta_123";

        var act = () => DotEnvLoader.LoadFromDictionary(dict);

        act.Should().Throw<EnvConfigurationException>()
            .WithMessage("*VIOLAÇÃO CRÍTICA DE SEGURANÇA (Fail-Fast): A chave 'JWT_KEY'*no mínimo 32 caracteres*");
    }

    [Fact]
    public void LoadFromDictionary_QuandoEmProducaoEChaveExemploPadrao_DeveLancarExcecao()
    {
        var dict = CreateValidDevDictionary();
        dict["ENVIRONMENT"] = "production";
        dict["JWT_KEY"] = "ChaveSecretaUltraSeguraRestauranteInteligente2026!#@$";
        dict["INTERNAL_SERVICE_API_KEY"] = "chave_producao_valida_123456789";

        var act = () => DotEnvLoader.LoadFromDictionary(dict);

        act.Should().Throw<EnvConfigurationException>()
            .WithMessage("*Chave JWT default de exemplo detectada em ambiente de produção*");
    }

    [Fact]
    public void LoadFromDictionary_QuandoEmProducaoESemChaveServico_DeveLancarExcecao()
    {
        var dict = CreateValidDevDictionary();
        dict["ENVIRONMENT"] = "production";
        dict["JWT_KEY"] = "ChaveRealmenteSeguraDeProducaoGeradaParaOAmbiente2026!";
        dict["INTERNAL_SERVICE_API_KEY"] = "";

        var act = () => DotEnvLoader.LoadFromDictionary(dict);

        act.Should().Throw<EnvConfigurationException>()
            .WithMessage("*A chave interna de serviço*mandatória em produção*");
    }

    [Fact]
    public void LoadFromDictionary_QuandoPortaInvalida_DeveLancarExcecaoFailFast()
    {
        var dict = CreateValidDevDictionary();
        dict["POSTGRES_PORT"] = "porta_invalida_nao_numerica";

        var act = () => DotEnvLoader.LoadFromDictionary(dict);

        act.Should().Throw<EnvConfigurationException>()
            .WithMessage("*não é um número inteiro válido*");
    }

    [Fact]
    public void LoadFromDictionary_QuandoConfiguracaoValida_DeveConstruirArvoreCompleta()
    {
        var dict = CreateValidDevDictionary();

        var settings = DotEnvLoader.LoadFromDictionary(dict);

        settings.Should().NotBeNull();
        settings.IsDevelopment.Should().BeTrue();
        settings.IsProduction.Should().BeFalse();

        settings.Database.Host.Should().Be("127.0.0.1");
        settings.Database.Port.Should().Be(5432);
        settings.Database.Database.Should().Be("restaurante_db");
        settings.Database.ConnectionString.Should().Contain("Host=127.0.0.1");

        settings.Redis.Host.Should().Be("127.0.0.1");
        settings.Redis.Port.Should().Be(6379);
        settings.Redis.Password.Should().Be("redis_seguro_123");
        settings.Redis.BuildConnectionString().Should().Contain("password=redis_seguro_123");

        settings.RabbitMq.Host.Should().Be("127.0.0.1");
        settings.RabbitMq.Port.Should().Be(5672);
        settings.RabbitMq.Username.Should().Be("guest");

        settings.Jwt.Key.Should().Be("DevLocalOnlyKeyNotForProdUseSecure2026!#@$");
        settings.Jwt.Issuer.Should().Be("RestauranteInteligente");
        settings.Jwt.Audience.Should().Be("RestauranteInteligente.App");
        settings.Jwt.ExpirationMinutes.Should().Be(15);

        settings.Security.InternalServiceApiKey.Should().Be("dev_internal_service_api_key_2026_local");
    }

    private static Dictionary<string, string?> CreateValidDevDictionary() => new(StringComparer.OrdinalIgnoreCase)
    {
        ["ENVIRONMENT"] = "development",
        ["POSTGRES_USER"] = "postgres",
        ["POSTGRES_PASSWORD"] = "postgres_seguro_123",
        ["POSTGRES_DB"] = "restaurante_db",
        ["POSTGRES_HOST"] = "127.0.0.1",
        ["POSTGRES_PORT"] = "5432",
        ["REDIS_HOST"] = "127.0.0.1",
        ["REDIS_PORT"] = "6379",
        ["REDIS_PASSWORD"] = "redis_seguro_123",
        ["REDIS_DB"] = "0",
        ["RABBITMQ_HOST"] = "127.0.0.1",
        ["RABBITMQ_PORT"] = "5672",
        ["RABBITMQ_USER"] = "guest",
        ["RABBITMQ_PASSWORD"] = "guest",
        ["JWT_KEY"] = "DevLocalOnlyKeyNotForProdUseSecure2026!#@$",
        ["JWT_ISSUER"] = "RestauranteInteligente",
        ["JWT_AUDIENCE"] = "RestauranteInteligente.App",
        ["JWT_EXPIRATION_MINUTES"] = "15",
        ["JWT_REFRESH_EXPIRATION_DAYS"] = "7",
        ["INTERNAL_SERVICE_API_KEY"] = "dev_internal_service_api_key_2026_local",
        ["MERCADO_PAGO_WEBHOOK_SECRET"] = "dev_mp_secret_webhook_key_2026_local"
    };
}
