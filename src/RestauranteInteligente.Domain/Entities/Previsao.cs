using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Previsão de demanda gerada pelo pipeline assíncrono de Machine Learning.
/// </summary>
public sealed class Previsao : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid ProdutoId { get; private set; }
    public DateOnly DataPrevisao { get; private set; }
    public DateOnly DataReferencia { get; private set; }
    public decimal QuantidadePrevista { get; private set; }
    public string ModeloVersao { get; private set; } = string.Empty;
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    // Navegações de Domínio / EF Core
    public Produto? Produto { get; private set; }

    private Previsao() { }

    public Previsao(
        Guid id,
        Guid restauranteId,
        Guid produtoId,
        DateOnly dataPrevisao,
        DateOnly dataReferencia,
        decimal quantidadePrevista,
        string modeloVersao,
        DateTimeOffset? criadoEm = null)
    {
        if (produtoId == Guid.Empty)
            throw new ArgumentException("O identificador do produto é obrigatório.", nameof(produtoId));

        if (quantidadePrevista < 0m)
            throw new ArgumentOutOfRangeException(nameof(quantidadePrevista), "A quantidade prevista de demanda não pode ser negativa.");

        if (string.IsNullOrWhiteSpace(modeloVersao))
            throw new ArgumentException("A versão do modelo de ML é obrigatória.", nameof(modeloVersao));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        ProdutoId = produtoId;
        DataPrevisao = dataPrevisao;
        DataReferencia = dataReferencia;
        QuantidadePrevista = quantidadePrevista;
        ModeloVersao = modeloVersao.Trim();
        CriadoEm = criadoEm ?? DateTimeOffset.UtcNow;
    }

    public void AtualizarPrevisao(decimal quantidadePrevista, string modeloVersao, DateTimeOffset? criadoEm = null)
    {
        if (quantidadePrevista < 0m)
            throw new ArgumentOutOfRangeException(nameof(quantidadePrevista), "A quantidade prevista de demanda não pode ser negativa.");

        if (string.IsNullOrWhiteSpace(modeloVersao))
            throw new ArgumentException("A versão do modelo de ML é obrigatória.", nameof(modeloVersao));

        QuantidadePrevista = quantidadePrevista;
        ModeloVersao = modeloVersao.Trim();
        CriadoEm = criadoEm ?? DateTimeOffset.UtcNow;
    }
}

