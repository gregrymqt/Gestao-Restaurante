using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class EventsControllerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Mock<ISseEventStreamService> _streamServiceMock;
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly EventsController _controller;

    public EventsControllerTests()
    {
        _streamServiceMock = new Mock<ISseEventStreamService>();
        _tenantContextMock = new Mock<ITenantContext>();

        _controller = new EventsController(
            _streamServiceMock.Object,
            _tenantContextMock.Object,
            NullLogger<EventsController>.Instance
        );
    }

    [Fact]
    public async Task PublishEventAsync_SemTenantDefinido_DeveRetornarBadRequest()
    {
        _tenantContextMock.Setup(tc => tc.HasTenant).Returns(false);

        var result = await _controller.PublishEventAsync(
            new PublishStreamEventRequest("PrevisaoConcluida", "{}"),
            CancellationToken.None
        );

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task PublishEventAsync_ComTenantValido_DeveRetornarAcceptedEPublicarNoStream()
    {
        _tenantContextMock.Setup(tc => tc.HasTenant).Returns(true);
        _tenantContextMock.Setup(tc => tc.RestauranteId).Returns(_tenantId);

        var result = await _controller.PublishEventAsync(
            new PublishStreamEventRequest("PrevisaoConcluida", "{\"sucesso\":true}"),
            CancellationToken.None
        );

        result.Should().BeOfType<AcceptedResult>();

        _streamServiceMock.Verify(s => s.PublishAsync(
            _tenantId,
            "PrevisaoConcluida",
            "{\"sucesso\":true}",
            It.IsAny<Guid>(),
            It.IsAny<CancellationToken>()
        ), Times.Once);
    }

    [Fact]
    public async Task StreamEventsAsync_SemTenantDefinido_DeveRetornarStatus400BadRequest()
    {
        _tenantContextMock.Setup(tc => tc.HasTenant).Returns(false);
        var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        await _controller.StreamEventsAsync(CancellationToken.None);

        httpContext.Response.StatusCode.Should().Be(Microsoft.AspNetCore.Http.StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task StreamEventsAsync_ComTenantValido_DeveDefinirHeadersSSE_EEnviarHandshake()
    {
        _tenantContextMock.Setup(tc => tc.HasTenant).Returns(true);
        _tenantContextMock.Setup(tc => tc.RestauranteId).Returns(_tenantId);

        var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        var memoryStream = new MemoryStream();
        httpContext.Response.Body = memoryStream;
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(200));

        // Stream assíncrono que cancela após curto período para teste
        async IAsyncEnumerable<RestauranteInteligente.Domain.Common.Models.TenantStreamEvent> EmptyStream()
        {
            await Task.Yield();
            yield break;
        }

        _streamServiceMock.Setup(s => s.SubscribeAsync(_tenantId, It.IsAny<CancellationToken>()))
            .Returns(EmptyStream());

        await _controller.StreamEventsAsync(cts.Token);

        httpContext.Response.Headers.ContentType.ToString().Should().Be("text/event-stream");
        httpContext.Response.Headers.CacheControl.ToString().Should().Be("no-cache");
        httpContext.Response.Headers.Connection.ToString().Should().Be("keep-alive");
        httpContext.Response.Headers["X-Accel-Buffering"].ToString().Should().Be("no");

        memoryStream.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(memoryStream);
        var content = await reader.ReadToEndAsync();
        content.Should().Contain($":connected for tenant {_tenantId}");
    }
}
