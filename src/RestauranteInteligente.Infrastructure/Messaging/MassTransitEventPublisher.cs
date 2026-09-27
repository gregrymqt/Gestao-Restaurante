using MassTransit;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Infrastructure.Messaging;

/// <summary>
/// Publicador resiliente de eventos assíncronos no broker RabbitMQ via MassTransit.
/// Emite mensagens em Raw JSON sem envelopes proprietários de metadados .NET,
/// assegurando interoperabilidade direta com o modelo Pydantic V2 do microsserviço Python.
/// </summary>
public sealed class MassTransitEventPublisher : IEventPublisher
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<MassTransitEventPublisher> _logger;

    public MassTransitEventPublisher(IPublishEndpoint publishEndpoint, ILogger<MassTransitEventPublisher> logger)
    {
        _publishEndpoint = publishEndpoint ?? throw new ArgumentNullException(nameof(publishEndpoint));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : class
    {
        if (message == null)
            throw new ArgumentNullException(nameof(message));

        try
        {
            await _publishEndpoint.Publish(message, cancellationToken);
            _logger.LogInformation("Mensagem do tipo '{MessageType}' publicada com sucesso via MassTransit RabbitMQ.",
                typeof(T).Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao publicar mensagem do tipo '{MessageType}' no RabbitMQ.", typeof(T).Name);
            throw;
        }
    }
}
