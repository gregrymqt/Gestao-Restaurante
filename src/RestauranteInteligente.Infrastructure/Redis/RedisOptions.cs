namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// Opções de configuração para conexão ao Redis.
/// </summary>
public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    public string Host { get; set; } = "127.0.0.1";
    public int Port { get; set; } = 6379;
    public string? Password { get; set; } = "redis_seguro_123";
    public int Database { get; set; } = 0;
    public int ConnectTimeoutMs { get; set; } = 5000;
    public int SyncTimeoutMs { get; set; } = 5000;
    public int ConnectRetry { get; set; } = 5;
    public bool AbortOnConnectFail { get; set; } = false;

    public string BuildConnectionString()
    {
        var passwordPart = string.IsNullOrWhiteSpace(Password) ? "" : $",password={Password}";
        return $"{Host}:{Port},abortConnect={AbortOnConnectFail},connectTimeout={ConnectTimeoutMs},syncTimeout={SyncTimeoutMs},connectRetry={ConnectRetry}{passwordPart}";
    }
}
