using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Api.Controllers;

[ApiController]
[Authorize]
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

        // Envia cabeçalhos mandatários para SSE e desativação de buffering em proxies reversos (Nginx/Cloudflare)
        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");
        Response.Headers.Append("X-Accel-Buffering", "no");

        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, HttpContext.RequestAborted);
        var ct = linkedCts.Token;

        using var syncLock = new SemaphoreSlim(1, 1);
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));

        async Task WriteChunkAsync(string message)
        {
            await syncLock.WaitAsync(ct);
            try
            {
                await Response.WriteAsync(message, ct);
                await Response.Body.FlushAsync(ct);
            }
            finally
            {
                syncLock.Release();
            }
        }

        try
        {
            // Envia mensagem inicial de handshake SSE
            await WriteChunkAsync($":connected for tenant {tenantId}\n\n");

            var heartbeatTask = Task.Run(async () =>
            {
                try
                {
                    while (await timer.WaitForNextTickAsync(ct))
                    {
                        await WriteChunkAsync(": heartbeat\n\n");
                    }
                }
                catch (OperationCanceledException)
                {
                    // Encerramento natural por desconexão do cliente
                }
            }, ct);

            var streamTask = Task.Run(async () =>
            {
                try
                {
                    await foreach (var evt in _streamService.SubscribeAsync(tenantId, ct))
                    {
                        var sseMessage = $"id: {evt.CorrelationId}\nevent: {evt.EventType}\ndata: {evt.PayloadJson}\n\n";
                        await WriteChunkAsync(sseMessage);
                    }
                }
                catch (OperationCanceledException)
                {
                    // Encerramento natural por desconexão do cliente
                }
            }, ct);

            await Task.WhenAny(heartbeatTask, streamTask);
        }
        catch (OperationCanceledException)
        {
            // Conexão encerrada pelo cliente
        }
        finally
        {
            await linkedCts.CancelAsync();
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
