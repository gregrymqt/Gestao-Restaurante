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
}
