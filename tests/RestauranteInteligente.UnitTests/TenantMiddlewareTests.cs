using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Middlewares;
using RestauranteInteligente.Application.Common.Interfaces;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class TenantMiddlewareTests
{
    private readonly Guid _tenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _tenantB = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private readonly Mock<ITenantContext> _tenantContextMock;

    public TenantMiddlewareTests()
    {
        _tenantContextMock = new Mock<ITenantContext>();
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

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance);

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

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance);

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

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance);

        var context = new DefaultHttpContext();
        var claims = new[] { new Claim("restaurante_id", _tenantA.ToString()) };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        await middleware.InvokeAsync(context, _tenantContextMock.Object);

        nextCalled.Should().BeTrue();
        _tenantContextMock.Verify(t => t.SetTenantId(_tenantA), Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_QuandoAnonimoEComHeader_DeveAssumirTenantDoHeader()
    {
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new TenantMiddleware(next, NullLogger<TenantMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Request.Headers[TenantMiddleware.TenantHeaderName] = _tenantB.ToString();

        await middleware.InvokeAsync(context, _tenantContextMock.Object);

        nextCalled.Should().BeTrue();
        _tenantContextMock.Verify(t => t.SetTenantId(_tenantB), Times.Once);
    }
}
