namespace RestauranteInteligente.Application.Common.Interfaces;

/// <summary>
/// Contrato de publicação assíncrona de eventos para o broker de mensageria (RabbitMQ).
/// Desacopla a camada de aplicação de frameworks específicos de mensageria.
/// </summary>
public interface IEventPublisher
{
    Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : class;
}
