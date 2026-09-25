using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Threading.Channels;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Models;
using StackExchange.Redis;

namespace RestauranteInteligente.Infrastructure.Redis;

/// <summary>
/// Barramento de streaming de eventos em tempo real utilizando Redis Pub/Sub e System.Threading.Channels.
/// Fornece o backend reativo para endpoints Server-Sent Events (SSE).
/// </summary>
public sealed class RedisStreamService : ISseEventStreamService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IRedisConnectionFactory _connectionFactory;
    private readonly ILogger<RedisStreamService> _logger;

    public RedisStreamService(
        IRedisConnectionFactory connectionFactory,
        ILogger<RedisStreamService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task PublishAsync(
        Guid tenantId,
        string eventType,
        string payloadJson,
        Guid correlationId = default,
        CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(eventType)) throw new ArgumentException("EventType não pode ser vazio.", nameof(eventType));

        ct.ThrowIfCancellationRequested();

        var streamEvent = new TenantStreamEvent(
            EventType: eventType,
            PayloadJson: payloadJson ?? "{}",
            Timestamp: DateTimeOffset.UtcNow,
            CorrelationId: correlationId == default ? Guid.NewGuid() : correlationId
        );

        var channelName = RedisKeyHelper.BuildTenantStreamChannel(tenantId);
        var serializedEvent = JsonSerializer.Serialize(streamEvent, JsonOptions);

        var subscriber = _connectionFactory.GetSubscriber();
        await subscriber.PublishAsync(RedisChannel.Literal(channelName), serializedEvent);

        _logger.LogDebug("Evento '{EventType}' publicado no canal '{Channel}'.", eventType, channelName);
    }

    public async IAsyncEnumerable<TenantStreamEvent> SubscribeAsync(
        Guid tenantId,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("TenantId não pode ser vazio.", nameof(tenantId));

        var channelName = RedisKeyHelper.BuildTenantStreamChannel(tenantId);
        var subscriber = _connectionFactory.GetSubscriber();

        // Canal assíncrono com contrapressão para proteger o consumo de memória
        var channel = Channel.CreateBounded<TenantStreamEvent>(new BoundedChannelOptions(500)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleWriter = true,
            SingleReader = true
        });

        void MessageHandler(RedisChannel rChannel, RedisValue message)
        {
            if (message.IsNullOrEmpty) return;

            try
            {
                var evt = JsonSerializer.Deserialize<TenantStreamEvent>(message.ToString(), JsonOptions);
                if (evt != null)
                {
                    channel.Writer.TryWrite(evt);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao desserializar mensagem do canal '{Channel}'.", channelName);
            }
        }

        var redisChannel = RedisChannel.Literal(channelName);
        await subscriber.SubscribeAsync(redisChannel, MessageHandler);
        _logger.LogInformation("Assinatura iniciada no canal SSE Redis '{Channel}'.", channelName);

        try
        {
            while (!ct.IsCancellationRequested)
            {
                TenantStreamEvent item;
                try
                {
                    item = await channel.Reader.ReadAsync(ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                yield return item;
            }
        }
        finally
        {
            channel.Writer.TryComplete();
            try
            {
                await subscriber.UnsubscribeAsync(redisChannel, MessageHandler);
                _logger.LogInformation("Assinatura cancelada no canal SSE Redis '{Channel}'.", channelName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao cancelar assinatura no canal '{Channel}'.", channelName);
            }
        }
    }
}
