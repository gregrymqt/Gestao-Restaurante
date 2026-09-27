using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Interceptor transacional do Npgsql para ativação atômica do PostgreSQL Row-Level Security (RLS).
/// Executa 'SELECT set_config('app.current_restaurante_id', @restauranteId, true);' atomicamente no início
/// de cada transação (is_local = true), assegurando que o contexto de isolamento pertença estritamente
/// à transação ativa (sem contaminação do pool de conexões do Npgsql).
/// </summary>
public sealed class PostgresRlsTransactionInterceptor : DbTransactionInterceptor
{
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<PostgresRlsTransactionInterceptor> _logger;

    public PostgresRlsTransactionInterceptor(
        ITenantContext tenantContext,
        ILogger<PostgresRlsTransactionInterceptor> logger)
    {
        _tenantContext = tenantContext;
        _logger = logger;
    }

    public override async ValueTask<DbTransaction> TransactionStartedAsync(
        DbConnection connection,
        TransactionEndEventData eventData,
        DbTransaction result,
        CancellationToken cancellationToken = default)
    {
        await ConfigurarRlsSessaoAsync(connection, result, cancellationToken);
        return await base.TransactionStartedAsync(connection, eventData, result, cancellationToken);
    }

    public override DbTransaction TransactionStarted(
        DbConnection connection,
        TransactionEndEventData eventData,
        DbTransaction result)
    {
        ConfigurarRlsSessaoAsync(connection, result, CancellationToken.None).GetAwaiter().GetResult();
        return base.TransactionStarted(connection, eventData, result);
    }

    private async Task ConfigurarRlsSessaoAsync(
        DbConnection? connection,
        DbTransaction transaction,
        CancellationToken cancellationToken)
    {
        if (connection == null || !_tenantContext.HasTenant)
        {
            _logger.LogDebug("RLS Interceptor: Conexão nula ou TenantContext não inicializado para a transação.");
            return;
        }

        var tenantId = _tenantContext.RestauranteId;

        await using var cmd = connection.CreateCommand();
        cmd.Transaction = transaction;
        cmd.CommandText = "SELECT set_config('app.current_restaurante_id', @restauranteId, true);";

        var param = cmd.CreateParameter();
        param.ParameterName = "restauranteId";
        param.Value = tenantId.ToString();
        cmd.Parameters.Add(param);

        await cmd.ExecuteNonQueryAsync(cancellationToken);
        _logger.LogDebug("RLS Interceptor: Variável de sessão 'app.current_restaurante_id' configurada localmente para '{TenantId}'.", tenantId);
    }
}
