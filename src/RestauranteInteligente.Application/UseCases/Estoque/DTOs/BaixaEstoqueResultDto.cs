namespace RestauranteInteligente.Application.UseCases.Estoque.DTOs;

/// <summary>
/// DTO representando o resultado da operação de baixa de estoque.
/// </summary>
public sealed record BaixaEstoqueResultDto(bool Sucesso, string? MensagemErro = null);
