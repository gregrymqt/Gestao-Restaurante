using System.IO;
using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Middlewares;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Infrastructure.Redis;
using StackExchange.Redis;
using Xunit;

namespace RestauranteInteligente.UnitTests;

/// <summary>
/// Bateria de Testes Discriminatórios de Resiliência de Borda no Redis.
/// Valida a discriminação de tráfego abusivo via Sliding Window Rate Limiting (anti-brute-force no login,
/// cotas para usuários autenticados e clientes anônimos) e proteção contra duplicidades/replay attacks
/// via controle de Idempotência com Hash Tags isoladas por RestauranteId.
/// </summary>
public sealed class EdgeResilienceAndIdempotencyDiscriminatoryTests
{
    private readonly Guid _tenantA = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private readonly Guid _tenantB = Guid.Parse("66666666-6666-6666-6666-666666666666");

    [Fact]
    public async Task RateLimitingMiddleware_PreflightOptions_DeveIgnorarEChamarProximoSemConsumirCota()
    {
        // Arrange
        var proximoInvocado = false;
        RequestDelegate next = (ctx) =>
        {
            proximoInvocado = true;
            return Task.CompletedTask;
        };

        var middleware = new RateLimitingMiddleware(next, NullLogger<RateLimitingMiddleware>.Instance);
        var rateLimiterMock = new Mock<IRateLimiterService>();

        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Options;

        // Act
        await middleware.InvokeAsync(context, rateLimiterMock.Object);

        // Assert
        proximoInvocado.Should().BeTrue("requisições preflight CORS OPTIONS devem prosseguir sem bloqueio");
        rateLimiterMock.Verify(r => r.CheckRateLimitAsync(
            It.IsAny<string>(), It.IsAny<long>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()),
            Times.Never, "o preflight CORS não deve consumir cota de rate limit do cliente");
    }

    [Fact]
    public async Task RateLimitingMiddleware_ClienteAutenticado_DeveDiscriminarPorTenantEUsuarioComCota120()
    {
        // Arrange
        var userId = "user-vip-007";
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Path = "/api/v1/vendas";

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("restaurante_id", _tenantA.ToString())
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var rateLimiterMock = new Mock<IRateLimiterService>();
        rateLimiterMock.Setup(r => r.CheckRateLimitAsync(
            $"tenant:{{{_tenantA}}}:user:{userId}",
            120,
            TimeSpan.FromMinutes(1),
            It.IsAny<CancellationToken>()
        )).ReturnsAsync(new RateLimitResult(IsAllowed: true, CurrentCount: 5, Limit: 120, RetryAfter: TimeSpan.Zero));

        var proximoInvocado = false;
        RequestDelegate next = (ctx) =>
        {
            proximoInvocado = true;
            return Task.CompletedTask;
        };

        var middleware = new RateLimitingMiddleware(next, NullLogger<RateLimitingMiddleware>.Instance);

        // Act
        await middleware.InvokeAsync(context, rateLimiterMock.Object);

        // Assert
        proximoInvocado.Should().BeTrue();
        context.Response.Headers["X-RateLimit-Limit"].ToString().Should().Be("120");
        context.Response.Headers["X-RateLimit-Remaining"].ToString().Should().Be("115"); // 120 - 5
    }

    [Fact]
    public async Task RateLimitingMiddleware_LoginAnonimo_DeveAplicarPoliticaRestritivaAntiBruteForce10()
    {
        // Arrange: Cliente não autenticado tentando efetuar login
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Path = "/api/v1/auth/login";
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("203.0.113.195");

        var rateLimiterMock = new Mock<IRateLimiterService>();
        rateLimiterMock.Setup(r => r.CheckRateLimitAsync(
            "anon:login:ip:203.0.113.195",
            10,
            TimeSpan.FromMinutes(1),
            It.IsAny<CancellationToken>()
        )).ReturnsAsync(new RateLimitResult(IsAllowed: true, CurrentCount: 1, Limit: 10, RetryAfter: TimeSpan.Zero));

        var middleware = new RateLimitingMiddleware((_) => Task.CompletedTask, NullLogger<RateLimitingMiddleware>.Instance);

        // Act
        await middleware.InvokeAsync(context, rateLimiterMock.Object);

        // Assert
        rateLimiterMock.Verify(r => r.CheckRateLimitAsync(
            "anon:login:ip:203.0.113.195",
            10,
            TimeSpan.FromMinutes(1),
            It.IsAny<CancellationToken>()),
            Times.Once, "o endpoint de autenticação deve ser discriminado com cota restritiva anti-brute force de 10 req/min");
    }

    [Fact]
    public async Task RateLimitingMiddleware_AnonimoGeral_DeveAplicarPoliticaGeral60()
    {
        // Arrange: Cliente anônimo consultando catálogo
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;
        context.Request.Path = "/api/v1/produtos";
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("198.51.100.42");

        var rateLimiterMock = new Mock<IRateLimiterService>();
        rateLimiterMock.Setup(r => r.CheckRateLimitAsync(
            "anon:general:ip:198.51.100.42",
            60,
            TimeSpan.FromMinutes(1),
            It.IsAny<CancellationToken>()
        )).ReturnsAsync(new RateLimitResult(IsAllowed: true, CurrentCount: 10, Limit: 60, RetryAfter: TimeSpan.Zero));

        var middleware = new RateLimitingMiddleware((_) => Task.CompletedTask, NullLogger<RateLimitingMiddleware>.Instance);

        // Act
        await middleware.InvokeAsync(context, rateLimiterMock.Object);

        // Assert
        rateLimiterMock.Verify(r => r.CheckRateLimitAsync(
            "anon:general:ip:198.51.100.42",
            60,
            TimeSpan.FromMinutes(1),
            It.IsAny<CancellationToken>()),
            Times.Once, "endpoints gerais anônimos devem receber cota padrão de 60 req/min");
    }

    [Fact]
    public async Task RateLimitingMiddleware_QuandoLimiteExcedido_DeveDiscriminarCom429TooManyRequestsERetryAfter()
    {
        // Arrange: Cliente estourou a cota
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Path = "/api/v1/auth/login";
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.0.2.1");

        using var responseStream = new MemoryStream();
        context.Response.Body = responseStream;

        var rateLimiterMock = new Mock<IRateLimiterService>();
        rateLimiterMock.Setup(r => r.CheckRateLimitAsync(
            It.IsAny<string>(), It.IsAny<long>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()
        )).ReturnsAsync(new RateLimitResult(
            IsAllowed: false,
            CurrentCount: 11,
            Limit: 10,
            RetryAfter: TimeSpan.FromSeconds(34)
        ));

        var proximoInvocado = false;
        RequestDelegate next = (_) =>
        {
            proximoInvocado = true;
            return Task.CompletedTask;
        };

        var middleware = new RateLimitingMiddleware(next, NullLogger<RateLimitingMiddleware>.Instance);

        // Act
        await middleware.InvokeAsync(context, rateLimiterMock.Object);

        // Assert
        proximoInvocado.Should().BeFalse("a requisição que excedeu o rate limit não deve chegar aos controllers");
        context.Response.StatusCode.Should().Be(StatusCodes.Status429TooManyRequests);
        context.Response.Headers["Retry-After"].ToString().Should().Be("34");
        context.Response.ContentType.Should().Contain("application/problem+json");

        responseStream.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(responseStream);
        var body = await reader.ReadToEndAsync();

        var problem = JsonSerializer.Deserialize<ProblemDetails>(body);
        problem.Should().NotBeNull();
        problem!.Title.Should().Be("Limite de Requisições Excedido");
        problem.Status.Should().Be(StatusCodes.Status429TooManyRequests);
    }

    [Fact]
    public async Task Idempotencia_OperacoesMesmoTenantMesmaChave_DeveDiscriminarPrimeiraPermitidaESegundaRejeitada()
    {
        // Arrange
        var redisFactoryMock = new Mock<IRedisConnectionFactory>();
        var databaseMock = new Mock<IDatabase>();
        redisFactoryMock.Setup(f => f.GetDatabase()).Returns(databaseMock.Object);

        var service = new RedisIdempotencyService(redisFactoryMock.Object, NullLogger<RedisIdempotencyService>.Instance);
        var opKey = "venda-pix-uuid-123";
        var expectedRedisKey = RedisKeyHelper.BuildIdempotencyKey(_tenantA, opKey);

        // Primeira chamada: chave não existe no Redis -> SET NX retorna true
        // Segunda chamada (replay attack ou duplo clique): chave já existe -> SET NX retorna false
        databaseMock.SetupSequence(db => db.StringSetAsync(
            expectedRedisKey,
            "PROCESSING",
            It.IsAny<TimeSpan?>(),
            When.NotExists,
            CommandFlags.None
        )).ReturnsAsync(true).ReturnsAsync(false);

        // Act
        var tentativa1 = await service.TryAcquireAsync(_tenantA, opKey, TimeSpan.FromMinutes(5));
        var tentativa2 = await service.TryAcquireAsync(_tenantA, opKey, TimeSpan.FromMinutes(5));

        // Assert
        tentativa1.Should().BeTrue("a primeira requisição com chave de idempotência válida deve ser processada");
        tentativa2.Should().BeFalse("a segunda requisição idêntica deve ser discriminada e barrada para evitar cobrança/baixa duplicada");
    }

    [Fact]
    public void Idempotencia_MesmaChaveEmTenantsDistintos_DeveGerarChavesRedisIsoladasPorHashTag()
    {
        // Arrange: Dois restaurantes distintos usam a mesma chave de operação no PDV
        var opKey = "venda-balcao-001";

        // Act
        var keyA = RedisKeyHelper.BuildIdempotencyKey(_tenantA, opKey);
        var keyB = RedisKeyHelper.BuildIdempotencyKey(_tenantB, opKey);

        // Assert
        keyA.Should().NotBe(keyB);
        keyA.Should().Be($"{{{_tenantA}}}:idempotency:venda-balcao-001");
        keyB.Should().Be($"{{{_tenantB}}}:idempotency:venda-balcao-001");
    }

    [Fact]
    public async Task Idempotencia_CicloCompletoComRollbackERelease_DevePermitirReprocessamentoAposFalha()
    {
        // Arrange
        var redisFactoryMock = new Mock<IRedisConnectionFactory>();
        var databaseMock = new Mock<IDatabase>();
        redisFactoryMock.Setup(f => f.GetDatabase()).Returns(databaseMock.Object);

        var service = new RedisIdempotencyService(redisFactoryMock.Object, NullLogger<RedisIdempotencyService>.Instance);
        var opKey = "venda-com-falha-reversivel";
        var expectedRedisKey = RedisKeyHelper.BuildIdempotencyKey(_tenantA, opKey);

        databaseMock.Setup(db => db.KeyDeleteAsync(expectedRedisKey, CommandFlags.None))
            .ReturnsAsync(true);

        // Act: Liberação após rollback na camada de use cases
        await service.ReleaseAsync(_tenantA, opKey);

        // Assert
        databaseMock.Verify(db => db.KeyDeleteAsync(expectedRedisKey, CommandFlags.None), Times.Once,
            "quando uma transação sofre rollback, a chave deve ser deletada para permitir nova tentativa legítima do cliente");
    }

    [Fact]
    public async Task Idempotencia_CicloCompletoComSucesso_DeveMarcarCompletedEImpedirReprocessamento()
    {
        // Arrange
        var redisFactoryMock = new Mock<IRedisConnectionFactory>();
        var databaseMock = new Mock<IDatabase>();
        redisFactoryMock.Setup(f => f.GetDatabase()).Returns(databaseMock.Object);

        var service = new RedisIdempotencyService(redisFactoryMock.Object, NullLogger<RedisIdempotencyService>.Instance);
        var opKey = "venda-concluida-sucesso";
        var expectedRedisKey = RedisKeyHelper.BuildIdempotencyKey(_tenantA, opKey);

        var retentionTtl = TimeSpan.FromHours(24);
        databaseMock.Setup(db => db.StringSetAsync(
            expectedRedisKey,
            "COMPLETED",
            retentionTtl,
            When.Always,
            CommandFlags.None
        )).ReturnsAsync(true);

        // Act: Marcação de conclusão pós-commit
        await service.MarkCompletedAsync(_tenantA, opKey, retentionTtl);

        // Assert
        databaseMock.Verify(db => db.StringSetAsync(
            expectedRedisKey,
            "COMPLETED",
            retentionTtl,
            When.Always,
            CommandFlags.None),
            Times.Once, "uma transação comitada com sucesso deve permanecer gravada como COMPLETED no Redis pelo prazo de retenção");
    }
}
