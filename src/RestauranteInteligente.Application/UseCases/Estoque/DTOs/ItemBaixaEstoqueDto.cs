namespace RestauranteInteligente.Application.UseCases.Estoque.DTOs;

/// <summary>
/// DTO representando um item de insumo e sua respectiva quantidade para baixa transacional.
/// </summary>
public sealed record ItemBaixaEstoqueDto(Guid InsumoId, decimal Quantidade);
