using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using RestauranteInteligente.Api.Middlewares;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Security;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class TenantMiddlewareTests
{
    private const string ValidApiKey = "secret_service_api_key_test_12345";
    private readonly Guid _tenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _tenantB = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly IOptions<SecurityOptions> _securityOptions;

    public TenantMiddlewareTests()
    {
        _tenantContextMock = new Mock<ITenantContext>();
        _securityOptions = Options.Create(new SecurityOptions
        {
            InternalServiceApiKey = ValidApiKey
        });
    }

    [Fact]
    public async Task InvokeAsync_QuandoAutenticadoETenantDoHeaderDivergenteDaClaim_DeveRetornar403Forbidden()
    {
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance, _securityOptions);

        var context = new DefaultHttpContext();
        var claims = new[] { new Claim("restaurante_id", _tenantA.ToString()) };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        context.Request.Headers[TenantMiddleware.TenantHeaderName] = _tenantB.ToString(); // TENTATIVA DE SPOOFING

        await middleware.InvokeAsync(context, _tenantContextMock.Object);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        context.Response.ContentType.Should().Contain("application/problem+json");
        nextCalled.Should().BeFalse("o pipeline deve ser abortado em caso de tenant spoofing");
        _tenantContextMock.Verify(t => t.SetTenantId(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_QuandoAutenticadoETenantDoHeaderIdenticoAClaim_DevePermitirEDefinirContexto()
    {
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance, _securityOptions);

        var context = new DefaultHttpContext();
        var claims = new[] { new Claim("restaurante_id", _tenantA.ToString()) };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        context.Request.Headers[TenantMiddleware.TenantHeaderName] = _tenantA.ToString();

        await middleware.InvokeAsync(context, _tenantContextMock.Object);

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        nextCalled.Should().BeTrue();
        _tenantContextMock.Verify(t => t.SetTenantId(_tenantA), Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_QuandoAutenticadoESemHeader_DeveAssumirTenantDaClaim()
    {
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance, _securityOptions);

        var context = new DefaultHttpContext();
        var claims = new[] { new Claim("restaurante_id", _tenantA.ToString()) };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        await middleware.InvokeAsync(context, _tenantContextMock.Object);

        nextCalled.Should().BeTrue();
        _tenantContextMock.Verify(t => t.SetTenantId(_tenantA), Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_QuandoAnonimoEComHeaderSemApiKey_DeveRetornar401Unauthorized()
    {
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance, _securityOptions);

        var context = new DefaultHttpContext();
        context.Request.Headers[TenantMiddleware.TenantHeaderName] = _tenantB.ToString();

        await middleware.InvokeAsync(context, _tenantContextMock.Object);

        context.Response.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        context.Response.ContentType.Should().Contain("application/problem+json");
        nextCalled.Should().BeFalse("chamadores anônimos sem X-API-Key não podem definir o tenant");
        _tenantContextMock.Verify(t => t.SetTenantId(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_QuandoAnonimoEComHeaderComApiKeyInvalida_DeveRetornar401Unauthorized()
    {
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance, _securityOptions);

        var context = new DefaultHttpContext();
        context.Request.Headers[TenantMiddleware.TenantHeaderName] = _tenantB.ToString();
        context.Request.Headers[TenantMiddleware.ApiKeyHeaderName] = "chave_invalida_hack";

        await middleware.InvokeAsync(context, _tenantContextMock.Object);

        context.Response.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        nextCalled.Should().BeFalse();
        _tenantContextMock.Verify(t => t.SetTenantId(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_QuandoAnonimoEComHeaderComApiKeyValida_DeveDefinirTenantEChamarProximo()
    {
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance, _securityOptions);

        var context = new DefaultHttpContext();
        context.Request.Headers[TenantMiddleware.TenantHeaderName] = _tenantB.ToString();
        context.Request.Headers[TenantMiddleware.ApiKeyHeaderName] = ValidApiKey;

        await middleware.InvokeAsync(context, _tenantContextMock.Object);

        nextCalled.Should().BeTrue();
        _tenantContextMock.Verify(t => t.SetTenantId(_tenantB), Times.Once);
    }
}
