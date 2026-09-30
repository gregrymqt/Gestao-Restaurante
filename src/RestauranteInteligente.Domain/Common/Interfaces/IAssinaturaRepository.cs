using RestauranteInteligente.Domain.Entities;

namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato do repositório de assinaturas e catálogo de planos SaaS.
/// </summary>
public interface IAssinaturaRepository
{
    Task<Assinatura?> ObterPorRestauranteIdAsync(Guid restauranteId, CancellationToken ct = default);
    Task AdicionarAsync(Assinatura assinatura, CancellationToken ct = default);
    Task AtualizarAsync(Assinatura assinatura, CancellationToken ct = default);
    Task<IReadOnlyList<Plano>> ObterPlanosAtivosAsync(CancellationToken ct = default);
    Task<Plano?> ObterPlanoPorIdAsync(Guid planoId, CancellationToken ct = default);
    Task<IReadOnlyList<Assinatura>> ObterTodasAssinaturasAsync(CancellationToken ct = default);
}
