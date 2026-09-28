namespace RestauranteInteligente.Infrastructure.Configuration;

/// <summary>
/// Contrato de configuração para conexão e credenciais do PostgreSQL.
/// </summary>
public interface IDatabaseConfig
{
    string Host { get; }
    int Port { get; }
    string Database { get; }
    string Username { get; }
    string Password { get; }
    string ConnectionString { get; }
}

/// <summary>
/// Contrato de configuração para conexão e parâmetros do Redis.
/// </summary>
public interface IRedisConfig
{
    string Host { get; }
    int Port { get; }
    string Password { get; }
    int Database { get; }
    int ConnectTimeoutMs { get; }
    int SyncTimeoutMs { get; }
    int ConnectRetry { get; }
    bool AbortOnConnectFail { get; }
    string BuildConnectionString();
}

/// <summary>
/// Contrato de configuração para mensageria RabbitMQ.
/// </summary>
public interface IRabbitMqConfig
{
    string Host { get; }
    int Port { get; }
    string Username { get; }
    string Password { get; }
}

/// <summary>
/// Contrato de configuração para emissão e validação de tokens JWT.
/// </summary>
public interface IJwtConfig
{
    string Key { get; }
    string Issuer { get; }
    string Audience { get; }
    int ExpirationMinutes { get; }
    int RefreshTokenExpirationDays { get; }
}

/// <summary>
/// Contrato de configuração para segurança de serviço M2M e webhooks.
/// </summary>
public interface ISecurityConfig
{
    string InternalServiceApiKey { get; }
    string MercadoPagoWebhookSecret { get; }
}

/// <summary>
/// Raiz soberana agregando todas as configurações de ambiente do sistema.
/// </summary>
public interface IAppEnvSettings
{
    string Environment { get; }
    bool IsProduction { get; }
    bool IsDevelopment { get; }
    IDatabaseConfig Database { get; }
    IRedisConfig Redis { get; }
    IRabbitMqConfig RabbitMq { get; }
    IJwtConfig Jwt { get; }
    ISecurityConfig Security { get; }
}
