using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Caixa.DTOs;
using RestauranteInteligente.Application.Common.Events;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Caixa.UseCases;

/// <summary>
/// Caso de uso de encerramento da sessão de caixa operacional.
/// Consolida vendas do dia, atualiza status para FECHADO, consulta meteorologia externa resiliente
/// e dispara eventos assíncronos via RabbitMQ para o Worker Python de Machine Learning.
/// Totalmente desacoplado de IAppDbContext utilizando IUnitOfWork e repositórios segregados.
/// </summary>
public sealed class FecharCaixaUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFechamentoCaixaRepository _fechamentoCaixaRepository;
    private readonly IVendaRepository _vendaRepository;
    private readonly IDadosClimaticosRepository _dadosClimaticosRepository;
    private readonly IProdutoRepository _produtoRepository;
    private readonly IRestauranteRepository _restauranteRepository;
    private readonly ITenantContext _tenantContext;
    private readonly IEventPublisher _eventPublisher;
    private readonly IWeatherClient _weatherClient;
    private readonly ILogger<FecharCaixaUseCase> _logger;

    public FecharCaixaUseCase(
        IUnitOfWork unitOfWork,
        IFechamentoCaixaRepository fechamentoCaixaRepository,
        IVendaRepository vendaRepository,
        IDadosClimaticosRepository dadosClimaticosRepository,
        IProdutoRepository produtoRepository,
        IRestauranteRepository restauranteRepository,
        ITenantContext tenantContext,
        IEventPublisher eventPublisher,
        IWeatherClient weatherClient,
        ILogger<FecharCaixaUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _fechamentoCaixaRepository = fechamentoCaixaRepository ?? throw new ArgumentNullException(nameof(fechamentoCaixaRepository));
        _vendaRepository = vendaRepository ?? throw new ArgumentNullException(nameof(vendaRepository));
        _dadosClimaticosRepository = dadosClimaticosRepository ?? throw new ArgumentNullException(nameof(dadosClimaticosRepository));
        _produtoRepository = produtoRepository ?? throw new ArgumentNullException(nameof(produtoRepository));
        _restauranteRepository = restauranteRepository ?? throw new ArgumentNullException(nameof(restauranteRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _eventPublisher = eventPublisher ?? throw new ArgumentNullException(nameof(eventPublisher));
        _weatherClient = weatherClient ?? throw new ArgumentNullException(nameof(weatherClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<FecharCaixaOutputDto> ExecutarAsync(CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var tenantId = _tenantContext.RestauranteId;

        // 1. Localização da sessão de caixa atualmente aberta
        var caixaAberto = await _fechamentoCaixaRepository.ObterCaixaAbertoAsync(ct);

        if (caixaAberto == null)
            throw new InvalidOperationException("Operação cancelada: Nenhuma sessão de caixa aberta foi localizada para encerramento.");

        // 2. Encerramento formal do caixa
        var dataFechamento = DateTimeOffset.UtcNow;
        caixaAberto.Encerrar(dataFechamento);

        await _unitOfWork.CommitAsync(ct);

        _logger.LogInformation("Sessão de caixa {CaixaId} encerrada com sucesso no restaurante {TenantId}. Vendas: {Qtd}, Total: {Total:C}",
            caixaAberto.Id, tenantId, caixaAberto.QuantidadeVendas, caixaAberto.TotalVendas);

        // 3. Coleta de histórico dos últimos 14 dias de vendas para o pipeline de ML
        var dataLimiteInicio = new DateTimeOffset(dataFechamento.UtcDateTime.Date.AddDays(-14), TimeSpan.Zero);
        var vendasRecentes = await _vendaRepository.ObterVendasConcluidasPorPeriodoAsync(dataLimiteInicio, ct);

        var historicoVendas = vendasRecentes
            .GroupBy(v => DateOnly.FromDateTime(v.DataHora.Date))
            .Select(g => new HistoricoVendaPontoPayloadDto(g.Key, g.Count()))
            .OrderBy(h => h.Data)
            .ToList();

        var dataAlvo = DateOnly.FromDateTime(dataFechamento.Date.AddDays(1));

        // 4. Integração meteorológica externa resiliente (Open-Meteo) com fallback gracioso
        decimal lat = 0m;
        decimal lon = 0m;

        var restaurante = await _restauranteRepository.ObterPorIdAsync(tenantId, ct);
        if (restaurante != null)
        {
            lat = restaurante.Latitude;
            lon = restaurante.Longitude;
        }

        WeatherData weatherData;
        try
        {
            weatherData = await _weatherClient.ObterPrevisaoClimaAsync(lat, lon, dataAlvo, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha na chamada ao WeatherClient para restaurante {TenantId}. Aplicando degradação graciosa com valores padrão.", tenantId);
            weatherData = new WeatherData(25.0m, 60.0m, 0.0m);
        }

        // Persistência com upsert formal na tabela DadosClimaticos para a data alvo
        var dadoClimaticoExistente = await _dadosClimaticosRepository.ObterPorDataAsync(dataAlvo, ct);

        if (dadoClimaticoExistente != null)
        {
            dadoClimaticoExistente.AtualizarClima(weatherData.Temperatura, weatherData.Umidade, weatherData.Precipitacao, "PREVISAO");
        }
        else
        {
            var novoDadoClimatico = new DadosClimaticos(
                id: Guid.NewGuid(),
                restauranteId: tenantId,
                data: dataAlvo,
                temperatura: weatherData.Temperatura,
                umidade: weatherData.Umidade,
                precipitacao: weatherData.Precipitacao,
                tipoDado: "PREVISAO"
            );
            await _dadosClimaticosRepository.AdicionarAsync(novoDadoClimatico, ct);
        }

        await _unitOfWork.CommitAsync(ct);

        var temp = weatherData.Temperatura;
        var precip = weatherData.Precipitacao;
        var umidade = weatherData.Umidade;
        var climaPayload = new ParametroMeteorologicoPayloadDto(temp, precip, umidade);

        // 5. Coleta do catálogo de produtos ativos
        var produtosAtivos = await _produtoRepository.ObterTodosAtivosAsync(ct);

        var produtosPayload = produtosAtivos
            .Select(p => new ProdutoPrevisaoItemPayloadDto(p.Id, p.Preco))
            .ToList();

        // 6. Publicação de Mensageria assíncrona (RabbitMQ / MassTransit Raw JSON)
        var correlationId = Guid.NewGuid();

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
