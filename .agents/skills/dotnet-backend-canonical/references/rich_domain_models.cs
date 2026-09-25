// ==============================================================================
// Manual Canónico de Backend: ASP.NET Core (.NET 9 / C# 13)
// Modelos de Domínio Rico com Encapsulamento Invariante
// ==============================================================================

using System;
using System.Collections.Generic;

namespace RestauranteInteligente.Domain.Common;

public interface IRestauranteEntity
{
    Guid RestauranteId { get; }
}

namespace RestauranteInteligente.Domain.Enums;

public enum TipoMovimentacao
{
    Entrada,
    Saida,
    Ajuste
}

public enum OrigemMovimentacao
{
    Venda,
    Compra,
    Inventario,
    Descarte
}

namespace RestauranteInteligente.Domain.Exceptions;

public class DomainValidationException : Exception
{
    public DomainValidationException(string message) : base(message) { }
}

public class EstoqueInsuficienteException : Exception
{
    public EstoqueInsuficienteException(string message) : base(message) { }
}

namespace RestauranteInteligente.Domain.Entities;

using RestauranteInteligente.Domain.Common;
using RestauranteInteligente.Domain.Enums;
using RestauranteInteligente.Domain.Exceptions;

public sealed class Insumo : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string UnidadeMedida { get; private set; } = string.Empty;
    public decimal QuantidadeEstoque { get; private set; }
    public decimal EstoqueMinimo { get; private set; }
    public decimal CustoUnitario { get; private set; }
    public bool Ativo { get; private set; }
    public DateTimeOffset CriadoEm { get; private set; }
    public uint Version { get; private set; } // Token de concorrência PostgreSQL (xmin)

    private Insumo() { }

    public Insumo(Guid restauranteId, string nome, string unidadeMedida, decimal estoqueMinimo, decimal custoUnitario)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new DomainValidationException("A nomenclatura do insumo deve ser obrigatoriamente informada.");

        if (custoUnitario < 0m)
            throw new DomainValidationException("O custo unitário de aquisição não pode ser negativo.");

        if (estoqueMinimo < 0m)
            throw new DomainValidationException("O estoque mínimo não pode ser negativo.");

        Id = Guid.NewGuid();
        RestauranteId = restauranteId;
        Nome = nome.Trim();
        UnidadeMedida = unidadeMedida.Trim().ToUpperInvariant();
        EstoqueMinimo = estoqueMinimo;
        CustoUnitario = custoUnitario;
        QuantidadeEstoque = 0m;
        Ativo = true;
        CriadoEm = DateTimeOffset.UtcNow;
    }

    public void DebitarEstoque(decimal quantidade)
    {
        if (quantidade <= 0m)
            throw new DomainValidationException("O volume de baixa operacional deve ser estritamente superior a zero.");

        if (QuantidadeEstoque < quantidade)
            throw new EstoqueInsuficienteException($"Ruptura de estoque detectada para o insumo '{Nome}'. Saldo disponível: {QuantidadeEstoque} {UnidadeMedida}, Volume requerido: {quantidade} {UnidadeMedida}.");

        QuantidadeEstoque -= quantidade;
    }

    public void CreditarEstoque(decimal quantidade)
    {
        if (quantidade <= 0m)
            throw new DomainValidationException("O volume de entrada no inventário deve ser estritamente superior a zero.");

        QuantidadeEstoque += quantidade;
    }
}

public sealed class ProdutoInsumo
{
    public Guid Id { get; private set; }
    public Guid ProdutoId { get; private set; }
    public Guid InsumoId { get; private set; }
    public decimal Quantidade { get; private set; }

    public Insumo? Insumo { get; private set; }

    private ProdutoInsumo() { }

    public ProdutoInsumo(Guid produtoId, Guid insumoId, decimal quantidade)
    {
        if (quantidade <= 0m)
            throw new DomainValidationException("A quantidade fracionada do insumo na receita deve ser superior a zero.");

        Id = Guid.NewGuid();
        ProdutoId = produtoId;
        InsumoId = insumoId;
        Quantidade = quantidade;
    }
}

public sealed class Produto : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string? Descricao { get; private set; }
    public decimal Preco { get; private set; }
    public bool Ativo { get; private set; }
    public DateTimeOffset CriadoEm { get; private set; }
    public uint Version { get; private set; }

    private readonly List<ProdutoInsumo> _produtosInsumos = new();
    public IReadOnlyCollection<ProdutoInsumo> ProdutosInsumos => _produtosInsumos.AsReadOnly();

    private Produto() { }

    public Produto(Guid restauranteId, string nome, decimal preco, string? descricao = null)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new DomainValidationException("O nome do produto é obrigatório.");

        if (preco < 0m)
            throw new DomainValidationException("O preço de venda do produto não pode ser negativo.");

        Id = Guid.NewGuid();
        RestauranteId = restauranteId;
        Nome = nome.Trim();
        Preco = preco;
        Descricao = descricao?.Trim();
        Ativo = true;
        CriadoEm = DateTimeOffset.UtcNow;
    }

    public void AdicionarInsumoComposicao(Guid insumoId, decimal quantidade)
    {
        _produtosInsumos.Add(new ProdutoInsumo(Id, insumoId, quantidade));
    }
}

public sealed class Venda : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid FechamentoCaixaId { get; private set; }
    public DateTimeOffset DataHora { get; private set; }
    public decimal ValorTotal { get; private set; }
    public string FormaPagamento { get; private set; } = string.Empty;

    private readonly List<ItemVenda> _itens = new();
    public IReadOnlyCollection<ItemVenda> Itens => _itens.AsReadOnly();

    private Venda() { }

    public Venda(Guid restauranteId, Guid fechamentoCaixaId, string formaPagamento)
    {
        Id = Guid.NewGuid();
        RestauranteId = restauranteId;
        FechamentoCaixaId = fechamentoCaixaId;
        FormaPagamento = formaPagamento;
        DataHora = DateTimeOffset.UtcNow;
        ValorTotal = 0m;
    }

    public void AdicionarItem(Guid produtoId, int quantidade, decimal precoUnitario)
    {
        if (quantidade <= 0)
            throw new DomainValidationException("A quantidade do item deve ser superior a zero.");

        var item = new ItemVenda(Id, produtoId, quantidade, precoUnitario);
        _itens.Add(item);
        ValorTotal += item.Subtotal;
    }
}

public sealed class ItemVenda
{
    public Guid Id { get; private set; }
    public Guid VendaId { get; private set; }
    public Guid ProdutoId { get; private set; }
    public int Quantidade { get; private set; }
    public decimal PrecoUnitario { get; private set; }
    public decimal Subtotal { get; private set; }

    private ItemVenda() { }

    public ItemVenda(Guid vendaId, Guid produtoId, int quantidade, decimal precoUnitario)
    {
        Id = Guid.NewGuid();
        VendaId = vendaId;
        ProdutoId = produtoId;
        Quantidade = quantidade;
        PrecoUnitario = precoUnitario;
        Subtotal = quantidade * precoUnitario;
    }
}

public sealed class MovimentacaoEstoque : IRestauranteEntity
{
    public Guid Id { get; private set; }
    public Guid RestauranteId { get; private set; }
    public Guid InsumoId { get; private set; }
    public TipoMovimentacao Tipo { get; private set; }
    public decimal Quantidade { get; private set; }
    public DateTimeOffset DataHora { get; private set; }
    public OrigemMovimentacao Origem { get; private set; }
    public Guid? ReferenciaId { get; private set; }
    public string? Observacao { get; private set; }

    private MovimentacaoEstoque() { }

    public MovimentacaoEstoque(Guid restauranteId, Guid insumoId, TipoMovimentacao tipo, decimal quantidade, OrigemMovimentacao origem, Guid? referenciaId = null, string? observacao = null)
    {
        if (quantidade <= 0m)
            throw new DomainValidationException("A quantidade de movimentação deve ser superior a zero.");

        Id = Guid.NewGuid();
        RestauranteId = restauranteId;
        InsumoId = insumoId;
        Tipo = tipo;
        Quantidade = quantidade;
        Origem = origem;
        ReferenciaId = referenciaId;
        Observacao = observacao;
        DataHora = DateTimeOffset.UtcNow;
    }
}
