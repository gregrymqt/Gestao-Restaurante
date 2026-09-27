using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Domain.Entities;

/// <summary>
/// Sessão operacional de caixa consolidando transações financeiras e controle de turno.
/// </summary>
public sealed class FechamentoCaixa : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid UsuarioId { get; private set; }
    public DateTimeOffset DataAbertura { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DataFechamento { get; private set; }
    public string Status { get; private set; } = "ABERTO";
    public decimal TotalVendas { get; private set; }
    public int QuantidadeVendas { get; private set; }
    public DateTimeOffset CriadoEm { get; private set; } = DateTimeOffset.UtcNow;

    private FechamentoCaixa() { }

    public FechamentoCaixa(
        Guid id,
        Guid restauranteId,
        Guid usuarioId,
        DateTimeOffset? dataAbertura = null,
        DateTimeOffset? criadoEm = null)
    {
        if (usuarioId == Guid.Empty)
            throw new ArgumentException("O identificador do usuário responsável é obrigatório.", nameof(usuarioId));

        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        RestauranteId = restauranteId;
        UsuarioId = usuarioId;
        DataAbertura = dataAbertura ?? DateTimeOffset.UtcNow;
        Status = "ABERTO";
        TotalVendas = 0m;
        QuantidadeVendas = 0;
        CriadoEm = criadoEm ?? DateTimeOffset.UtcNow;
    }

    public void RegistrarVenda(decimal valorVenda)
    {
        if (Status != "ABERTO")
            throw new InvalidOperationException("Não é possível registrar vendas em um caixa fechado.");

        if (valorVenda < 0m)
            throw new ArgumentException("O valor da venda não pode ser negativo.", nameof(valorVenda));

        TotalVendas += valorVenda;
        QuantidadeVendas++;
    }

    public void Encerrar(DateTimeOffset? dataFechamento = null)
    {
        if (Status != "ABERTO")
            throw new InvalidOperationException("O caixa já se encontra encerrado.");

        Status = "FECHADO";
        DataFechamento = dataFechamento ?? DateTimeOffset.UtcNow;
    }
}
