using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Application.Vendas.DTOs;

/// <summary>
/// DTO de entrada para uma opção de modificador vinculada ao item de venda no PDV.
/// </summary>
public sealed record ItemVendaModificadorInputDto(
    Guid OpcaoId,
    string Nome,
    decimal PrecoAdicional,
    Guid? InsumoId = null,
    decimal QuantidadeInsumo = 0m,
    TipoAcaoModificador TipoAcao = TipoAcaoModificador.Culinario
);
