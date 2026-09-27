using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Caixa.DTOs;
using RestauranteInteligente.Application.Common.Events;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;

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
        var vendasRecentes = await _dbContext.Vendas
            .Where(v => v.Status == "CONCLUIDA" && v.DataHora >= dataLimiteInicio)
            .Include(v => v.Itens)
            .ToListAsync(ct);

        var historicoVendas = vendasRecentes
            .GroupBy(v => DateOnly.FromDateTime(v.DataHora.Date))
            .Select(g => new HistoricoVendaPontoPayloadDto(g.Key, g.Count()))
            .OrderBy(h => h.Data)
            .ToList();

        // 4. Coleta do último parâmetro meteorológico registrado
        var climaRecente = await _dbContext.DadosClimaticos
            .OrderByDescending(d => d.Data)
            .FirstOrDefaultAsync(ct);

        var temp = climaRecente?.Temperatura ?? 25.0m;
        var precip = climaRecente?.Precipitacao ?? 0.0m;
        var umidade = climaRecente?.Umidade ?? 60.0m;
        var climaPayload = new ParametroMeteorologicoPayloadDto(temp, precip, umidade);

        // 5. Coleta do catálogo de produtos ativos
        var produtosAtivos = await _dbContext.Produtos
            .Where(p => p.Ativo)
            .ToListAsync(ct);

        var produtosPayload = produtosAtivos
            .Select(p => new ProdutoPrevisaoItemPayloadDto(p.Id, p.Preco))
            .ToList();

        // 6. Publicação de Mensageria assíncrona (RabbitMQ / MassTransit Raw JSON)
        var correlationId = Guid.NewGuid();
        var dataAlvo = DateOnly.FromDateTime(dataFechamento.Date.AddDays(1));

        // 6.1 Publicação granular por produto (Fase 4 - fila previsao.demanda.solicitada)
        var datasUltimos14Dias = Enumerable.Range(0, 14)
            .Select(offset => dataFechamento.Date.AddDays(-14 + offset))
            .ToList();

        foreach (var prod in produtosAtivos)
        {
            var serie14Dias = datasUltimos14Dias.Select(dia =>
            {
                var vendasDoDia = vendasRecentes.Where(v => v.DataHora.Date == dia);
                return vendasDoDia
                    .SelectMany(v => v.Itens)
                    .Where(i => i.ProdutoId == prod.Id)
                    .Sum(i => i.Quantidade);
            }).ToList();

            var eventoPorProduto = new PrevisaoDemandaSolicitadaEvent(
                SolicitacaoId: Guid.NewGuid(),
                RestauranteId: tenantId,
                ProdutoId: prod.Id,
                DataAlvo: dataAlvo,
                HistoricoVendasRecentes: serie14Dias,
                TemperaturaPrevista: temp,
                PrecipitacaoPrevista: precip
            );

            await _eventPublisher.PublishAsync(eventoPorProduto, ct);
        }

        // 6.2 Publicação consolidada v1 para retrocompatibilidade
        var eventoPrevisao = new PrevisaoDemandaSolicitadaEvent_v1(
            CorrelationId: correlationId,
            RestauranteId: tenantId,
            DataAlvo: dataAlvo,
            Produtos: produtosPayload,
            Clima: climaPayload,
            HistoricoVendas: historicoVendas
        );

        await _eventPublisher.PublishAsync(eventoPrevisao, ct);

        _logger.LogInformation("Eventos de previsão disparados para {QtdProdutos} produtos no restaurante {TenantId}.",
            produtosAtivos.Count, tenantId);

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
