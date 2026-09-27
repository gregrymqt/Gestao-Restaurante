namespace RestauranteInteligente.Api.DTOs.Produtos;

/// <summary>
/// Contrato de resposta para produto via API.
/// </summary>
public sealed record ProdutoResponse(Guid Id, string Nome, string? Descricao, decimal Preco, bool Ativo);
