namespace RestauranteInteligente.Infrastructure.Configuration;

/// <summary>
/// Implementação concreta das configurações do banco PostgreSQL.
/// </summary>
public sealed record DatabaseConfig(
    string Host,
    int Port,
    string Database,
    string Username,
    string Password) : IDatabaseConfig
{
    public string ConnectionString =>
        $"Host={Host};Port={Port};Database={Database};Username={Username};Password={Password};Include Error Detail=true";
}

/// <summary>
/// Implementação concreta das configurações do cluster/instância Redis.
/// </summary>
public sealed record RedisConfig(
    string Host,
    int Port,
    string Password,
    int Database = 0,
    int ConnectTimeoutMs = 5000,
    int SyncTimeoutMs = 5000,
    int ConnectRetry = 5,
    bool AbortOnConnectFail = false) : IRedisConfig
{
    public string BuildConnectionString()
    {
        var passwordPart = string.IsNullOrWhiteSpace(Password) ? string.Empty : $",password={Password}";
        return $"{Host}:{Port},abortConnect={AbortOnConnectFail},connectTimeout={ConnectTimeoutMs},syncTimeout={SyncTimeoutMs},connectRetry={ConnectRetry}{passwordPart}";
    }
}

/// <summary>
/// Implementação concreta das configurações do broker RabbitMQ.
/// </summary>
public sealed record RabbitMqConfig(
    string Host,
    int Port,
    string Username,
    string Password) : IRabbitMqConfig;

/// <summary>
/// Implementação concreta das configurações de autenticação JWT.
/// </summary>
public sealed record JwtConfig(
    string Key,
    string Issuer,
    string Audience,
    int ExpirationMinutes,
    int RefreshTokenExpirationDays) : IJwtConfig;

/// <summary>
/// Implementação concreta das credenciais de segurança interna.
/// </summary>
public sealed record SecurityConfig(
    string InternalServiceApiKey,
    string MercadoPagoWebhookSecret) : ISecurityConfig;

/// <summary>
/// Agregador imutável de todas as configurações de ambiente.
/// </summary>
public sealed record AppEnvSettings(
    string Environment,
    IDatabaseConfig Database,
    IRedisConfig Redis,
    IRabbitMqConfig RabbitMq,
    IJwtConfig Jwt,
    ISecurityConfig Security) : IAppEnvSettings
{
    public bool IsProduction => string.Equals(Environment, "production", StringComparison.OrdinalIgnoreCase);
    public bool IsDevelopment => string.Equals(Environment, "development", StringComparison.OrdinalIgnoreCase);
}
