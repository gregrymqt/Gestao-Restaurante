using System.IO;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using RestauranteInteligente.Api.Middlewares;
using Xunit;

namespace RestauranteInteligente.UnitTests;

public sealed class ExceptionMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_SemExcecao_DeveExecutarNextComSucesso()
    {
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionMiddleware(next, NullLogger<ExceptionMiddleware>.Instance);
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_QuandoArgumentException_DeveRetornar400ProblemDetails()
    {
        RequestDelegate next = _ => throw new ArgumentException("Parâmetro inválido");

        var middleware = new ExceptionMiddleware(next, NullLogger<ExceptionMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        context.Response.ContentType.Should().Contain("application/problem+json");

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body);

        problem.Should().NotBeNull();
        problem!.Status.Should().Be(400);
        problem.Title.Should().Be("Requisição Inválida");
        problem.Detail.Should().Be("Parâmetro inválido");
    }

    [Fact]
    public async Task InvokeAsync_QuandoUnauthorizedAccessException_DeveRetornar403ProblemDetails()
    {
        RequestDelegate next = _ => throw new UnauthorizedAccessException("Sem permissão");

        var middleware = new ExceptionMiddleware(next, NullLogger<ExceptionMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        context.Response.ContentType.Should().Contain("application/problem+json");
    }

    [Fact]
    public async Task InvokeAsync_QuandoKeyNotFoundException_DeveRetornar404ProblemDetails()
    {
        RequestDelegate next = _ => throw new KeyNotFoundException("Item não encontrado");

        var middleware = new ExceptionMiddleware(next, NullLogger<ExceptionMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        context.Response.ContentType.Should().Contain("application/problem+json");
    }

    [Fact]
    public async Task InvokeAsync_QuandoInvalidOperationException_DeveRetornar422ProblemDetails()
    {
        RequestDelegate next = _ => throw new InvalidOperationException("Operação inconsistente");

        var middleware = new ExceptionMiddleware(next, NullLogger<ExceptionMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);
        context.Response.ContentType.Should().Contain("application/problem+json");
    }

    [Fact]
    public async Task InvokeAsync_QuandoExceptionGenerica_DeveRetornar500ProblemDetails()
    {
        RequestDelegate next = _ => throw new Exception("Falha catastrófica de infra");

        var middleware = new ExceptionMiddleware(next, NullLogger<ExceptionMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        context.Response.ContentType.Should().Contain("application/problem+json");
    }
}
