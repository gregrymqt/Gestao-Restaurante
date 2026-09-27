using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Registros meteorológicos (históricos ou previsões) utilizados como features no modelo preditivo de demanda.
/// </summary>
public sealed class DadosClimaticos : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public DateOnly Data { get; private set; }
    public decimal Temperatura { get; private set; }
    public decimal Umidade { get; private set; }
    public decimal Precipitacao { get; private set; }
    public string TipoDado { get; private set; } = "HISTORICO";
    public DateTimeOffset ConsultadoEm { get; private set; } = DateTimeOffset.UtcNow;

    private DadosClimaticos() { }

    public DadosClimaticos(
        Guid id,
        Guid restauranteId,
        DateOnly data,
        decimal temperatura,
        decimal umidade,
        decimal precipitacao,
        string tipoDado = "HISTORICO",
        DateTimeOffset? consultadoEm = null)
    {
        if (umidade < 0m || umidade > 100m)
            throw new ArgumentOutOfRangeException(nameof(umidade), "A umidade relativa deve situar-se entre 0% e 100%.");

        if (precipitacao < 0m)
            throw new ArgumentOutOfRangeException(nameof(precipitacao), "A precipitação pluviométrica não pode ser negativa.");

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        Data = data;
        Temperatura = temperatura;
        Umidade = umidade;
        Precipitacao = precipitacao;
        TipoDado = string.IsNullOrWhiteSpace(tipoDado) ? "HISTORICO" : tipoDado.Trim().ToUpperInvariant();
        ConsultadoEm = consultadoEm ?? DateTimeOffset.UtcNow;
    }
}
