using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace RestauranteInteligente.Api.Middlewares;

/// <summary>
/// Middleware de tratamento global de falhas conforme a especificação RFC 7807 (Problem Details).
/// Intercepta exceções não tratadas durante o ciclo de vida HTTP, registra logs com CorrelationId
/// e emite respostas padronizadas em application/problem+json.
/// </summary>
public sealed class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.TraceIdentifier;
        _logger.LogError(
            exception,
            "[HTTP ERROR] Exceção não tratada na requisição {Method} {Path}. CorrelationId: {CorrelationId}",
            context.Request.Method,
            context.Request.Path,
            correlationId);

        var details = new ProblemDetails
        {
            Instance = context.Request.Path,
            Extensions = { ["correlationId"] = correlationId }
        };

        switch (exception)
        {
            case ArgumentException or ArgumentNullException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                details.Status = (int)HttpStatusCode.BadRequest;
                details.Title = "Requisição Inválida";
                details.Detail = exception.Message;
                details.Type = "https://restauranteinteligente.io/errors/invalid-argument";
                break;

            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                details.Status = (int)HttpStatusCode.Forbidden;
                details.Title = "Acesso Não Autorizado";
                details.Detail = "O usuário atual não possui autorização para executar esta operação.";
                details.Type = "https://restauranteinteligente.io/errors/forbidden";
                break;

            case KeyNotFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                details.Status = (int)HttpStatusCode.NotFound;
                details.Title = "Recurso Não Encontrado";
                details.Detail = exception.Message;
                details.Type = "https://restauranteinteligente.io/errors/not-found";
                break;

            case InvalidOperationException invalidOpEx:
                context.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
                details.Status = (int)HttpStatusCode.UnprocessableEntity;
                details.Title = "Operação Não Processável";
                details.Detail = invalidOpEx.Message;
                details.Type = "https://restauranteinteligente.io/errors/unprocessable-entity";
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                details.Status = (int)HttpStatusCode.InternalServerError;
                details.Title = "Instabilidade Interna do Servidor";
                details.Detail = "Ocorreu um evento anômalo durante a execução da operação. CorrelationId: " + correlationId;
                details.Type = "https://restauranteinteligente.io/errors/internal-server-error";
                break;
        }

        context.Response.ContentType = "application/problem+json";
        return context.Response.WriteAsync(JsonSerializer.Serialize(details));
    }
}
