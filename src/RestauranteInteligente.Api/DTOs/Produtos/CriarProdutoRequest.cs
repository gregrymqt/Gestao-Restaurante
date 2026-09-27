namespace RestauranteInteligente.Api.DTOs.Produtos;

/// <summary>
/// Contrato de entrada para criação de produto via API.
/// </summary>
public sealed record CriarProdutoRequest(string Nome, string? Descricao, decimal Preco);
