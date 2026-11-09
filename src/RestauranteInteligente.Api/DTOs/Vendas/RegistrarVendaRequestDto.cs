using RestauranteInteligente.Domain.Enums;

namespace RestauranteInteligente.Api.DTOs.Vendas;

public sealed record ItemVendaModificadorRequestDto(
    Guid OpcaoId,
    string Nome,
    decimal PrecoAdicional,
    Guid? InsumoId = null,
    decimal QuantidadeInsumo = 0m,
    TipoAcaoModificador TipoAcao = TipoAcaoModificador.Culinario
);

public sealed record ItemVendaRequestDto(
    Guid ProdutoId,
    decimal Quantidade,
    List<ItemVendaModificadorRequestDto>? Modificadores = null
);

public sealed record RegistrarVendaRequestDto(
    string FormaPagamento,
    List<ItemVendaRequestDto> Itens
);
