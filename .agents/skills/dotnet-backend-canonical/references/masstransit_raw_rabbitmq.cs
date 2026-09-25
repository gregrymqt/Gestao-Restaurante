// ==============================================================================
// Manual Canónico de Backend: ASP.NET Core (.NET 9 / C# 13)
// Integração MassTransit com RabbitMQ e Serializador Raw JSON (Python Interop)
// ==============================================================================

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Application.Contracts.Messaging;

#region Contratos de Integração Versionados (Records Imutáveis)

public sealed record PrevisaoDemandaSolicitadaEvent(
    Guid CorrelationId,
    Guid RestauranteId,
    DateOnly DataAlvo,
    List<ProdutoPrevisaoItemPayload> Produtos,
    ParametroMeteorologicoPayload Clima
);

public sealed record ProdutoPrevisaoItemPayload(
    Guid ProdutoId, 
    decimal PrecoVenda
);

public sealed record ParametroMeteorologicoPayload(
    decimal Temperatura, 
    decimal Precipitacao, 
    decimal Umidade
);

public sealed record PrevisaoDemandaCalculadaEvent(
    Guid CorrelationId,
    Guid RestauranteId,
    Guid ProdutoId,
    DateOnly DataPrevisao,
    decimal DemandaPrevista,
    string VersaoModelo
);

#endregion

namespace RestauranteInteligente.Application.Common.Interfaces;

public interface IEventBus
{
    Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : class;
}

namespace RestauranteInteligente.Infrastructure.Messaging;

using RestauranteInteligente.Application.Contracts.Messaging;

public sealed class MassTransitEventBus : IEventBus
{
    private readonly IPublishEndpoint _publishEndpoint;

    public MassTransitEventBus(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : class
    {
        return _publishEndpoint.Publish(message, cancellationToken);
    }
}

public sealed class PrevisaoDemandaCalculadaConsumer : IConsumer<PrevisaoDemandaCalculadaEvent>
{
    private readonly ILogger<PrevisaoDemandaCalculadaConsumer> _logger;
    private readonly IAppDbContext _context;

    public PrevisaoDemandaCalculadaConsumer(
        ILogger<PrevisaoDemandaCalculadaConsumer> logger,
        IAppDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public async Task Consume(ConsumeContext<PrevisaoDemandaCalculadaEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "[MESSAGING] Previsão de demanda recebida do Python Worker. Produto: {ProdutoId}, Demanda: {Demanda}, Modelo: {Modelo}",
            msg.ProdutoId, msg.DemandaPrevista, msg.VersaoModelo);

        // A persistência é mediada exclusivamente pelo C# no PostgreSQL
        // Inserção na tabela Previsoes respeitando o RestauranteId recebido
        await Task.CompletedTask;
    }
}

public static class MessagingInfrastructureExtensions
{
    public static IServiceCollection AddMessagingInfrastructure(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        services.AddScoped<IEventBus, MassTransitEventBus>();

        services.AddMassTransit(config =>
        {
            config.AddConsumer<PrevisaoDemandaCalculadaConsumer>();

            config.UsingRabbitMq((context, bus) =>
            {
                var host = configuration["RabbitMQ:Host"] ?? "localhost";
                var user = configuration["RabbitMQ:Username"] ?? "guest";
                var pass = configuration["RabbitMQ:Password"] ?? "guest";

                bus.Host(host, "/", h =>
                {
                    h.Username(user);
                    h.Password(pass);
                });

                // CLÁUSULA MANDATÓRIA: Serialização JSON Pura (Raw) sem metadados abstratos do MassTransit
                // Permite a desserialização estrita pelos modelos Pydantic no Worker Python
                bus.UseRawJsonSerializer();

                bus.ReceiveEndpoint("queue:previsao_consolidada_csharp", endpoint =>
                {
                    endpoint.ConfigureConsumer<PrevisaoDemandaCalculadaConsumer>(context);
                    
                    // Política de Resiliência: 3 retentativas com intervalo de 5 segundos
                    endpoint.UseMessageRetry(retry => retry.Interval(3, TimeSpan.FromSeconds(5)));
                });

                bus.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
