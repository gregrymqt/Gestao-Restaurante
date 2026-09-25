// ==============================================================================
// Manual Canónico de Backend: ASP.NET Core (.NET 9 / C# 13)
// Middleware de Tratamento Global de Falhas (Especificação RFC 7807)
// ==============================================================================

using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Domain.Exceptions;

namespace RestauranteInteligente.Api.Middlewares;

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
        _logger.LogError(exception, "[ERROR] Falha de execução transacional. CorrelationId: {CorrelationId}", correlationId);

        var details = new ProblemDetails
        {
            Instance = context.Request.Path,
            Extensions = { ["correlationId"] = correlationId }
        };

        switch (exception)
        {
            case DomainValidationException domainEx:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                details.Status = (int)HttpStatusCode.BadRequest;
                details.Title = "Inconformidade de Regra de Negócio";
                details.Detail = domainEx.Message;
                details.Type = "https://restauranteinteligente.io/errors/business-rule";
                break;

            case EstoqueInsuficienteException stockEx:
                context.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
                details.Status = (int)HttpStatusCode.UnprocessableEntity;
                details.Title = "Capacidade de Estoque Insuficiente";
                details.Detail = stockEx.Message;
                details.Type = "https://restauranteinteligente.io/errors/insufficient-stock";
                break;

            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                details.Status = (int)HttpStatusCode.Forbidden;
                details.Title = "Acesso Não Autorizado";
                details.Detail = "O usuário atual não possui autorização operacional sobre o restaurante requisitado.";
                details.Type = "https://restauranteinteligente.io/errors/forbidden";
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                details.Status = (int)HttpStatusCode.InternalServerError;
                details.Title = "Instabilidade Interna do Servidor";
                details.Detail = "Ocorreu um evento anómalo de infraestrutura durante a execução da operação.";
                details.Type = "https://restauranteinteligente.io/errors/internal-server-error";
                break;
        }

        context.Response.ContentType = "application/problem+json";
        return context.Response.WriteAsync(JsonSerializer.Serialize(details));
    }
}
