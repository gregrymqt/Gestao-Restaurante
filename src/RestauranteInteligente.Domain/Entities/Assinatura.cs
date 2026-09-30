using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Assinatura SaaS vinculada ao inquilino (Restaurante), governando a vigência e o período de degustação (Free Trial de 14 dias).
/// </summary>
public sealed class Assinatura : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid? PlanoId { get; private set; }
    public StatusAssinatura Status { get; private set; } = StatusAssinatura.Trial;
    public DateTimeOffset DataInicio { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset DataFimTrial { get; private set; }
    public DateTimeOffset? DataExpiracao { get; private set; }
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    private Assinatura() { }

    public Assinatura(
        Guid id,
        Guid restauranteId,
        DateTimeOffset? dataInicio = null,
        DateTimeOffset? dataFimTrial = null,
        Guid? planoId = null)
    {
        if (restauranteId == Guid.Empty)
            throw new ArgumentException("O identificador do restaurante é obrigatório.", nameof(restauranteId));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        PlanoId = planoId;
        Status = StatusAssinatura.Trial;
        DataInicio = dataInicio ?? DateTimeOffset.UtcNow;
        DataFimTrial = dataFimTrial ?? DataInicio.AddDays(14);
        DataExpiracao = null;
        CriadoEm = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Verifica se o inquilino possui permissão de uso ativo no sistema (Trial válido ou assinatura ativa).
    /// </summary>
    public bool EstaVigente()
    {
        var agora = DateTimeOffset.UtcNow;

        if (Status == StatusAssinatura.Trial)
        {
            return DataFimTrial > agora;
        }

        if (Status == StatusAssinatura.Ativa)
        {
            return DataExpiracao == null || DataExpiracao.Value > agora;
        }

        return false;
    }

    /// <summary>
    /// Retorna a quantidade de dias restantes de Free Trial.
    /// </summary>
    public int DiasRestantesTrial()
    {
        if (Status != StatusAssinatura.Trial)
            return 0;

        var agora = DateTimeOffset.UtcNow;
        if (DataFimTrial <= agora)
            return 0;

        return (int)Math.Ceiling((DataFimTrial - agora).TotalDays);
    }

    /// <summary>
    /// Promove a assinatura para Ativa mediante contratação de um plano comercial.
    /// </summary>
    public void AtivarPlano(Guid planoId, int mesesVigencia = 1)
    {
        if (planoId == Guid.Empty)
            throw new ArgumentException("O identificador do plano é obrigatório.", nameof(planoId));

        if (mesesVigencia <= 0)
            throw new ArgumentOutOfRangeException(nameof(mesesVigencia), "A vigência deve ser de pelo menos 1 mês.");

        PlanoId = planoId;
        Status = StatusAssinatura.Ativa;
        DataExpiracao = DateTimeOffset.UtcNow.AddMonths(mesesVigencia);
    }

    /// <summary>
    /// Marca a assinatura como expirada após o término do Trial ou da vigência sem renovação.
    /// </summary>
    public void Expirar()
    {
        Status = StatusAssinatura.Expirada;
    }

    /// <summary>
    /// Cancela formalmente a assinatura do inquilino.
    /// </summary>
    public void Cancelar()
    {
        Status = StatusAssinatura.Cancelada;
    }

    /// <summary>
    /// Operação administrativa: estende a data final de Free Trial para o inquilino.
    /// </summary>
    public void EstenderTrial(int diasAdicionais)
    {
        if (diasAdicionais <= 0)
            throw new ArgumentOutOfRangeException(nameof(diasAdicionais), "A quantidade de dias adicionais deve ser maior que zero.");

        var baseCalculo = DataFimTrial > DateTimeOffset.UtcNow ? DataFimTrial : DateTimeOffset.UtcNow;
        DataFimTrial = baseCalculo.AddDays(diasAdicionais);
        Status = StatusAssinatura.Trial;
    }

    /// <summary>
    /// Operação administrativa: altera diretamente o status da assinatura pelo Backoffice.
    /// </summary>
    public void AlterarStatus(StatusAssinatura novoStatus)
    {
        Status = novoStatus;
        if (novoStatus == StatusAssinatura.Ativa && DataExpiracao == null)
        {
            DataExpiracao = DateTimeOffset.UtcNow.AddMonths(1);
        }
    }
}
