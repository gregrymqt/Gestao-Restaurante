using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Caixa.DTOs;
using RestauranteInteligente.Application.Common.Events;
using RestauranteInteligente.Application.Common.Interfaces;

namespace RestauranteInteligente.Application.Caixa.UseCases;

/// <summary>
/// Caso de uso de encerramento da sessão de caixa operacional.
/// Consolida vendas do dia, atualiza status para FECHADO e dispara o evento assíncrono
/// PrevisaoDemandaSolicitadaEvent_v1 via RabbitMQ para o Worker Python de Machine Learning.
/// </summary>
public sealed class FecharCaixaUseCase
{
    private readonly IAppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<FecharCaixaUseCase> _logger;

    public FecharCaixaUseCase(
        IAppDbContext dbContext,
        ITenantContext tenantContext,
        IEventPublisher eventPublisher,
        ILogger<FecharCaixaUseCase> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    public async Task<FecharCaixaOutputDto> ExecutarAsync(CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var tenantId = _tenantContext.RestauranteId;

        // 1. Localização da sessão de caixa atualmente aberta
        var caixaAberto = await _dbContext.FechamentosCaixa
            .FirstOrDefaultAsync(c => c.Status == "ABERTO", ct);

        if (caixaAberto == null)
            throw new InvalidOperationException("Operação cancelada: Nenhuma sessão de caixa aberta foi localizada para encerramento.");

        // 2. Encerramento formal do caixa
        var dataFechamento = DateTimeOffset.UtcNow;
        caixaAberto.Encerrar(dataFechamento);

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("Sessão de caixa {CaixaId} encerrada com sucesso no restaurante {TenantId}. Vendas: {Qtd}, Total: {Total:C}",
            caixaAberto.Id, tenantId, caixaAberto.QuantidadeVendas, caixaAberto.TotalVendas);

        // 3. Coleta de histórico dos últimos 14 dias de vendas para o pipeline de ML
        var dataLimiteInicio = dataFechamento.Date.AddDays(-14);
        var datasVendas = await _dbContext.Vendas
            .Where(v => v.Status == "CONCLUIDA" && v.DataHora >= dataLimiteInicio)
            .Select(v => v.DataHora)
            .ToListAsync(ct);

        var historicoVendas = datasVendas
            .GroupBy(d => DateOnly.FromDateTime(d.Date))
            .Select(g => new HistoricoVendaPontoPayloadDto(g.Key, g.Count()))
            .OrderBy(h => h.Data)
            .ToList();

        // 4. Coleta do último parâmetro meteorológico registrado
        var climaRecente = await _dbContext.DadosClimaticos
            .OrderByDescending(d => d.Data)
            .FirstOrDefaultAsync(ct);

        var climaPayload = climaRecente != null
            ? new ParametroMeteorologicoPayloadDto(climaRecente.Temperatura, climaRecente.Precipitacao, climaRecente.Umidade)
            : new ParametroMeteorologicoPayloadDto(25.0m, 0.0m, 60.0m);

        // 5. Coleta do catálogo de produtos ativos
        var produtosAtivos = await _dbContext.Produtos
            .Where(p => p.Ativo)
            .Select(p => new ProdutoPrevisaoItemPayloadDto(p.Id, p.Preco))
            .ToListAsync(ct);

        // 6. Publicação de Mensageria assíncrona (RabbitMQ / MassTransit Raw JSON)
        var correlationId = Guid.NewGuid();
        var dataAlvo = DateOnly.FromDateTime(dataFechamento.Date.AddDays(1));

        var eventoPrevisao = new PrevisaoDemandaSolicitadaEvent_v1(
            CorrelationId: correlationId,
            RestauranteId: tenantId,
            DataAlvo: dataAlvo,
            Produtos: produtosAtivos,
            Clima: climaPayload,
            HistoricoVendas: historicoVendas
        );

        await _eventPublisher.PublishAsync(eventoPrevisao, ct);

        _logger.LogInformation("Evento PrevisaoDemandaSolicitadaEvent_v1 publicado via RabbitMQ com CorrelationId {CorrelationId}.",
            correlationId);

        return new FecharCaixaOutputDto(
            caixaAberto.Id,
            caixaAberto.RestauranteId,
            caixaAberto.DataAbertura,
            caixaAberto.DataFechamento!.Value,
            caixaAberto.TotalVendas,
            caixaAberto.QuantidadeVendas,
            caixaAberto.Status,
            correlationId
        );
    }
}
