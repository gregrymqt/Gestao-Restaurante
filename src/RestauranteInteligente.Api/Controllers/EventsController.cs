using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Route("api/v1/events")]
public sealed class EventsController : ControllerBase
{
    private readonly ISseEventStreamService _streamService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<EventsController> _logger;

    public EventsController(
        ISseEventStreamService streamService,
        ITenantContext tenantContext,
        ILogger<EventsController> logger)
    {
        _streamService = streamService;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// Endpoint nativo Server-Sent Events (SSE) para streaming contínuo de eventos do tenant.
    /// Clientes móveis e web assinam eventos em tempo real sem polling.
    /// </summary>
    [HttpGet("stream")]
    [Produces("text/event-stream")]
    public async Task StreamEventsAsync(CancellationToken cancellationToken)
    {
        if (!_tenantContext.HasTenant)
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsync("Tenant não identificado. Forneça o cabeçalho X-Tenant-Id.", cancellationToken);
            return;
        }

        var tenantId = _tenantContext.RestauranteId;
        _logger.LogInformation("Iniciando streaming SSE para o restaurante {TenantId}...", tenantId);

        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");
        Response.Headers.Append("X-Accel-Buffering", "no");

        // Envia mensagem inicial de handshake SSE
        await Response.WriteAsync($":connected for tenant {tenantId}\n\n", cancellationToken);
        await Response.Body.FlushAsync(cancellationToken);

        try
        {
            await foreach (var evt in _streamService.SubscribeAsync(tenantId, cancellationToken))
            {
                var sseMessage = $"id: {evt.CorrelationId}\nevent: {evt.EventType}\ndata: {evt.PayloadJson}\n\n";
                await Response.WriteAsync(sseMessage, cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Cliente desconectou do streaming SSE do restaurante {TenantId}.", tenantId);
        }
    }

    /// <summary>
    /// Endpoint para emissão controlada de eventos de teste ou internos para o canal do tenant.
    /// </summary>
    [HttpPost("publish")]
    public async Task<IActionResult> PublishEventAsync([FromBody] PublishStreamEventRequest request, CancellationToken cancellationToken)
    {
        if (!_tenantContext.HasTenant)
        {
            return BadRequest(new { error = "Tenant não identificado. Forneça o cabeçalho X-Tenant-Id." });
        }

        if (string.IsNullOrWhiteSpace(request.EventType))
        {
            return BadRequest(new { error = "EventType é obrigatório." });
        }

        var tenantId = _tenantContext.RestauranteId;
        await _streamService.PublishAsync(
            tenantId,
            request.EventType,
            request.PayloadJson ?? "{}",
            correlationId: Guid.NewGuid(),
            ct: cancellationToken);

        return Accepted(new { status = "Evento despachado no barramento Redis Pub/Sub", tenantId, eventType = request.EventType });
    }
}

public sealed record PublishStreamEventRequest(string EventType, string? PayloadJson);
