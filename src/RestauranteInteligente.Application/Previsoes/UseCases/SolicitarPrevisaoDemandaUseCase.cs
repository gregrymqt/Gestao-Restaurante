using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Events;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Application.Previsoes.DTOs;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Previsoes.UseCases;

/// <summary>
/// Caso de uso para disparo de previsão de demanda sob demanda (on-demand) para o pipeline de ML.
/// Permite acionar a inferência e o treino da IA via RabbitMQ sem a obrigatoriedade de fechar o caixa.
/// </summary>
public class SolicitarPrevisaoDemandaUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IVendaRepository _vendaRepository;
    private readonly IDadosClimaticosRepository _dadosClimaticosRepository;
    private readonly IProdutoRepository _produtoRepository;
    private readonly IRestauranteRepository _restauranteRepository;
    private readonly ITenantContext _tenantContext;
    private readonly IEventPublisher _eventPublisher;
    private readonly IWeatherClient _weatherClient;
    private readonly ILogger<SolicitarPrevisaoDemandaUseCase> _logger;

    public SolicitarPrevisaoDemandaUseCase(
        IUnitOfWork unitOfWork,
        IVendaRepository vendaRepository,
        IDadosClimaticosRepository dadosClimaticosRepository,
        IProdutoRepository produtoRepository,
        IRestauranteRepository restauranteRepository,
        ITenantContext tenantContext,
        IEventPublisher eventPublisher,
        IWeatherClient weatherClient,
        ILogger<SolicitarPrevisaoDemandaUseCase> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _vendaRepository = vendaRepository ?? throw new ArgumentNullException(nameof(vendaRepository));
        _dadosClimaticosRepository = dadosClimaticosRepository ?? throw new ArgumentNullException(nameof(dadosClimaticosRepository));
        _produtoRepository = produtoRepository ?? throw new ArgumentNullException(nameof(produtoRepository));
        _restauranteRepository = restauranteRepository ?? throw new ArgumentNullException(nameof(restauranteRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _eventPublisher = eventPublisher ?? throw new ArgumentNullException(nameof(eventPublisher));
        _weatherClient = weatherClient ?? throw new ArgumentNullException(nameof(weatherClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public virtual async Task<SolicitarPrevisaoDemandaOutputDto> ExecutarAsync(DateOnly? dataAlvoParam = null, CancellationToken ct = default)
    {
        if (!_tenantContext.HasTenant)
            throw new InvalidOperationException("Operação cancelada: Contexto de restaurante (Tenant) não inicializado.");

        var tenantId = _tenantContext.RestauranteId;
        var agora = DateTimeOffset.UtcNow;
        var dataAlvo = dataAlvoParam ?? DateOnly.FromDateTime(agora.UtcDateTime.Date.AddDays(1));

        // 1. Coleta do histórico recente de vendas (últimos 14 dias)
        var dataLimiteInicio = new DateTimeOffset(agora.UtcDateTime.Date.AddDays(-14), TimeSpan.Zero);
        var vendasRecentes = await _vendaRepository.ObterVendasConcluidasPorPeriodoAsync(dataLimiteInicio, ct);

        var historicoVendas = vendasRecentes
            .GroupBy(v => DateOnly.FromDateTime(v.DataHora.Date))
            .Select(g => new HistoricoVendaPontoPayloadDto(g.Key, g.Count()))
            .OrderBy(h => h.Data)
            .ToList();

        // 2. Consulta meteorológica com resiliência
        decimal lat = -23.550520m;
        decimal lon = -46.633308m;

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
            _logger.LogWarning(ex, "Falha na chamada ao WeatherClient para restaurante {TenantId}. Aplicando degradação graciosa.", tenantId);
            weatherData = new WeatherData(24.0m, 65.0m, 0.0m);
        }

        // 3. Upsert do clima na data alvo
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

        // 4. Coleta dos produtos ativos
        var produtosAtivos = await _produtoRepository.ObterTodosAtivosAsync(ct);
        var produtosPayload = produtosAtivos
            .Select(p => new ProdutoPrevisaoItemPayloadDto(p.Id, p.Preco))
            .ToList();

        var correlationId = Guid.NewGuid();

        // 5. Publicação granular por produto no RabbitMQ
        var datasUltimos14Dias = Enumerable.Range(0, 14)
            .Select(offset => agora.Date.AddDays(-14 + offset))
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

        // 6. Publicação consolidada v1
        var eventoPrevisao = new PrevisaoDemandaSolicitadaEvent_v1(
            CorrelationId: correlationId,
            RestauranteId: tenantId,
            DataAlvo: dataAlvo,
            Produtos: produtosPayload,
            Clima: climaPayload,
            HistoricoVendas: historicoVendas
        );

        await _eventPublisher.PublishAsync(eventoPrevisao, ct);

        _logger.LogInformation(
            "Solicitação de previsão sob demanda disparada com sucesso para {QtdProdutos} produtos no restaurante {TenantId}. CorrelationId={CorrelationId}",
            produtosAtivos.Count, tenantId, correlationId);

        return new SolicitarPrevisaoDemandaOutputDto(
            correlationId,
            tenantId,
            dataAlvo,
            produtosAtivos.Count,
            temp,
            precip,
            "SOLICITADA",
            $"Eventos publicados no RabbitMQ para {produtosAtivos.Count} produtos ativos."
        );
    }
}
