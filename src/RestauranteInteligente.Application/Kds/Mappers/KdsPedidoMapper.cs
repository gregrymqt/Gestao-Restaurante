using System.Text.Json;
using RestauranteInteligente.Application.Kds.DTOs;
using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Application.Kds.Mappers;

/// <summary>
/// Mapeador compartilhado entre Venda/Itens e o contrato operacional do KDS.
/// </summary>
public static class KdsPedidoMapper
{
    public static PedidoKdsDto MapearParaDto(Venda venda)
    {
        ArgumentNullException.ThrowIfNull(venda);

        var codigoCurto = $"#{venda.Id.ToString("N")[..4].ToUpperInvariant()}";

        var itens = venda.Itens.Select(item => new PedidoKdsItemDto(
            Id: item.Id,
            ProdutoId: item.ProdutoId,
            NomeProduto: item.Produto?.Nome ?? $"Produto ({item.ProdutoId.ToString()[..6]})",
            Quantidade: item.Quantidade,
            Modificadores: ExtrairModificadores(item.ModificadoresJson)
        )).ToList();

        return new PedidoKdsDto(
            VendaId: venda.Id,
            CodigoCurto: codigoCurto,
            DataHora: venda.DataHora,
            StatusPreparo: venda.StatusPreparo,
            PreparoIniciadoEm: venda.PreparoIniciadoEm,
            ProntoEm: venda.ProntoEm,
            Itens: itens
        );
    }

    public static IReadOnlyList<PedidoKdsModificadorDto> ExtrairModificadores(string? modificadoresJson)
    {
        if (string.IsNullOrWhiteSpace(modificadoresJson))
            return Array.Empty<PedidoKdsModificadorDto>();

        try
        {
            using var doc = JsonDocument.Parse(modificadoresJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
                return Array.Empty<PedidoKdsModificadorDto>();

            var lista = new List<PedidoKdsModificadorDto>();
            foreach (var elem in doc.RootElement.EnumerateArray())
            {
                var nome = ObterStringCaseInsensitive(elem, "Nome", "nome") ?? "Observação";
                var tipoAcao = ResolverTipoAcao(elem);
                var precoAdicional = ObterDecimalCaseInsensitive(elem, "PrecoAdicional", "precoAdicional");

                lista.Add(new PedidoKdsModificadorDto(nome, tipoAcao, precoAdicional));
            }
            return lista;
        }
        catch (JsonException)
        {
            return Array.Empty<PedidoKdsModificadorDto>();
        }
    }

    private static string? ObterStringCaseInsensitive(JsonElement elem, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (elem.TryGetProperty(key, out var prop) && prop.ValueKind == JsonValueKind.String)
                return prop.GetString();
        }
        return null;
    }

    private static decimal ObterDecimalCaseInsensitive(JsonElement elem, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (elem.TryGetProperty(key, out var prop) && prop.ValueKind == JsonValueKind.Number && prop.TryGetDecimal(out var valor))
                return valor;
        }
        return 0m;
    }

    private static string ResolverTipoAcao(JsonElement elem)
    {
        foreach (var key in new[] { "TipoAcao", "tipoAcao" })
        {
            if (!elem.TryGetProperty(key, out var prop))
                continue;

            if (prop.ValueKind == JsonValueKind.String)
                return prop.GetString() ?? "Culinario";

            if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt32(out var code))
            {
                return code switch
                {
                    0 => "Culinario",
                    1 => "Remocao",
                    2 => "Adicional",
                    3 => "Substituicao",
                    _ => "Culinario"
                };
            }
        }
        return "Culinario";
    }
}
