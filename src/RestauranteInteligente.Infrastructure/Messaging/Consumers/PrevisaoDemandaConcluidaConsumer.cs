using MassTransit;
using Microsoft.Extensions.Logging;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Application.Common.Messages;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Infrastructure.Messaging.Consumers;

/// <summary>
/// Consumidor assíncrono MassTransit para o evento PrevisaoDemandaConcluidaEvent vindo do RabbitMQ.
/// Responsável pela persistência/upsert formal da demanda prevista na tabela Previsoes via Repositório e Unit of Work,
/// garantindo ativação do contexto multi-tenant (RLS + Global Query Filter).
/// </summary>
public sealed class PrevisaoDemandaConcluidaConsumer : IConsumer<PrevisaoDemandaConcluidaEvent>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPrevisaoRepository _previsaoRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<PrevisaoDemandaConcluidaConsumer> _logger;

    public PrevisaoDemandaConcluidaConsumer(
        IUnitOfWork unitOfWork,
        IPrevisaoRepository previsaoRepository,
        ITenantContext tenantContext,
        ILogger<PrevisaoDemandaConcluidaConsumer> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _previsaoRepository = previsaoRepository ?? throw new ArgumentNullException(nameof(previsaoRepository));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task Consume(ConsumeContext<PrevisaoDemandaConcluidaEvent> context)
    {
        var message = context.Message;
        if (message == null)
            return;

        _logger.LogInformation(
            "Consumindo PrevisaoDemandaConcluidaEvent: SolicitacaoId={SolicitacaoId}, RestauranteId={RestauranteId}, ProdutoId={ProdutoId}, DataAlvo={DataAlvo}, Qtd={Qtd}, Modelo={Modelo}",
            message.SolicitacaoId,
            message.RestauranteId,
            message.ProdutoId,
            message.DataAlvo,
            message.QuantidadePrevista,
            message.ModeloVersao);

        // CLÁUSULA INEGOCIÁVEL 2: Ativação mandatória do TenantContext para escopo de RLS e EF Core
        _tenantContext.SetTenantId(message.RestauranteId);

        var dataReferencia = DateOnly.FromDateTime(DateTime.UtcNow);

        var previsaoExistente = await _previsaoRepository.ObterPorProdutoEDataAsync(
            message.ProdutoId,
            message.DataAlvo,
            context.CancellationToken);

        if (previsaoExistente != null)
        {
            previsaoExistente.AtualizarPrevisao(message.QuantidadePrevista, message.ModeloVersao);
            _logger.LogInformation("Previsão existente {PrevisaoId} atualizada com nova quantidade {Qtd}.",
                previsaoExistente.Id, message.QuantidadePrevista);
        }
        else
        {
            var novaPrevisao = new Previsao(
                id: Guid.NewGuid(),
                restauranteId: message.RestauranteId,
                produtoId: message.ProdutoId,
                dataPrevisao: message.DataAlvo,
                dataReferencia: dataReferencia,
                quantidadePrevista: message.QuantidadePrevista,
                modeloVersao: message.ModeloVersao
            );

            await _previsaoRepository.AdicionarAsync(novaPrevisao, context.CancellationToken);
            _logger.LogInformation("Nova previsão registrada para produto {ProdutoId} e data {DataAlvo}.",
                message.ProdutoId, message.DataAlvo);
        }

        await _unitOfWork.CommitAsync(context.CancellationToken);

        _logger.LogInformation("Previsão de demanda para SolicitacaoId={SolicitacaoId} persistida com sucesso.",
            message.SolicitacaoId);
    }
}
