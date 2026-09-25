using System.IO;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Security;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class WebhooksControllerTests
{
    private const string WebhookSecret = "mp_secret_webhook_test_2026_seguro!";
    private readonly Mock<IWebhookSignatureValidator> _signatureValidatorMock;
    private readonly Mock<IIdempotencyService> _idempotencyServiceMock;
    private readonly IOptions<SecurityOptions> _securityOptions;
    private readonly WebhooksController _controller;

    public WebhooksControllerTests()
    {
        _signatureValidatorMock = new Mock<IWebhookSignatureValidator>();
        _idempotencyServiceMock = new Mock<IIdempotencyService>();
        _securityOptions = Options.Create(new SecurityOptions
        {
            MercadoPagoWebhookSecret = WebhookSecret
        });

        _controller = new WebhooksController(
            _signatureValidatorMock.Object,
            _idempotencyServiceMock.Object,
            _securityOptions,
            NullLogger<WebhooksController>.Instance
        );
    }

    [Fact]
    public async Task ReceiveMercadoPagoWebhook_SemHeaderDeAssinatura_DeveRetornar401Unauthorized()
    {
        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var result = await _controller.ReceiveMercadoPagoWebhook(CancellationToken.None);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task ReceiveMercadoPagoWebhook_ComAssinaturaValidaENovoEvento_DeveRetornar200Ok()
    {
        var jsonPayload = "{\"id\":\"123456\",\"event\":\"payment.updated\"}";
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(jsonPayload));

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Body = stream;
        httpContext.Request.Headers["x-signature"] = "t=123,v1=validhash";

        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _signatureValidatorMock.Setup(v => v.ValidateSignature(
            It.IsAny<string>(),
            "t=123,v1=validhash",
            WebhookSecret,
            It.IsAny<TimeSpan>()
        )).Returns(true);

        _idempotencyServiceMock.Setup(i => i.TryAcquireAsync(
            It.IsAny<Guid>(),
            "webhook:mercadopago:123456",
            It.IsAny<TimeSpan>(),
            It.IsAny<CancellationToken>()
        )).ReturnsAsync(true);

        var result = await _controller.ReceiveMercadoPagoWebhook(CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ReceiveMercadoPagoWebhook_ComAssinaturaInvalida_DeveRetornar401Unauthorized()
    {
        var jsonPayload = "{\"id\":\"123456\"}";
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(jsonPayload));

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Body = stream;
        httpContext.Request.Headers["x-signature"] = "t=123,v1=invalidhash";

        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _signatureValidatorMock.Setup(v => v.ValidateSignature(
            It.IsAny<string>(),
            "t=123,v1=invalidhash",
            WebhookSecret,
            It.IsAny<TimeSpan>()
        )).Returns(false);

        var result = await _controller.ReceiveMercadoPagoWebhook(CancellationToken.None);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }
}
