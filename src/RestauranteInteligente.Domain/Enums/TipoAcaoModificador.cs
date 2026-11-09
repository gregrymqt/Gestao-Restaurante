using System.Text.Json.Serialization;

namespace RestauranteInteligente.Domain.Enums;

/// <summary>
/// Determina o comportamento operacional e contábil de uma opção de modificador de pedido.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoAcaoModificador
{
    /// <summary>
    /// Instrução culinária visual para a cozinha (ex: "Ao Ponto", "Bem Passado"). Não altera preço nem estoque.
    /// </summary>
    Culinario = 1,

    /// <summary>
    /// Adicional com acréscimo monetário e potencial débito de insumo na ficha técnica (ex: "+ Bacon Extra").
    /// </summary>
    Adicional = 2,

    /// <summary>
    /// Instrução culinária de remoção de ingrediente (ex: "Sem Cebola", "Sem Picles"). Não gera estorno contábil.
    /// </summary>
    Remocao = 3
}
