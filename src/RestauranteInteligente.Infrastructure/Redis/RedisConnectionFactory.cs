using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// Provedor singleton resiliente de conexões StackExchange.Redis com gerenciamento de reconexão.
/// </summary>
public interface IRedisConnectionFactory : IDisposable
{
    IConnectionMultiplexer GetConnection();
    IDatabase GetDatabase();
    ISubscriber GetSubscriber();
}

public sealed class RedisConnectionFactory : IRedisConnectionFactory
{
    private readonly RedisOptions _options;
    private readonly ILogger<RedisConnectionFactory> _logger;
    private readonly Lazy<IConnectionMultiplexer> _lazyConnection;
    private bool _disposed;

    public RedisConnectionFactory(IOptions<RedisOptions> options, ILogger<RedisConnectionFactory> logger)
    {
        _options = options.Value;
        _logger = logger;
        _lazyConnection = new Lazy<IConnectionMultiplexer>(CreateConnection);
    }

    public IConnectionMultiplexer GetConnection()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        return _lazyConnection.Value;
    }

    public IDatabase GetDatabase()
    {
        return GetConnection().GetDatabase(_options.Database);
    }

    public ISubscriber GetSubscriber()
    {
        return GetConnection().GetSubscriber();
    }

    private IConnectionMultiplexer CreateConnection()
    {
        var configString = _options.BuildConnectionString();
        _logger.LogInformation("Conectando ao cluster/instância Redis em {Host}:{Port}...", _options.Host, _options.Port);

        var configuration = ConfigurationOptions.Parse(configString);
        configuration.ClientName = "RestauranteInteligente.Api";

        var multiplexer = ConnectionMultiplexer.Connect(configuration);

        multiplexer.ConnectionFailed += (_, args) =>
        {
            _logger.LogError(args.Exception, "Falha na conexão com Redis no endpoint {EndPoint}. Tipo: {FailureType}", args.EndPoint, args.FailureType);
        };

        multiplexer.ConnectionRestored += (_, args) =>
        {
            _logger.LogInformation("Conexão restabelecida com Redis no endpoint {EndPoint}.", args.EndPoint);
        };

        multiplexer.ErrorMessage += (_, args) =>
        {
            _logger.LogWarning("Mensagem de erro emitida pelo Redis: {Message} no endpoint {EndPoint}", args.Message, args.EndPoint);
        };

        return multiplexer;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        if (_lazyConnection.IsValueCreated)
        {
            try
            {
                _lazyConnection.Value.Dispose();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao descartar conexão do Redis.");
            }
        }
    }
}
