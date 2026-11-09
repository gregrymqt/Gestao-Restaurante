using RestauranteInteligente.Domain.Common.Interfaces;

namespace RestauranteInteligente.Application.Caixa.UseCases;

public sealed record StatusCaixaDto(
    string Status,
    decimal TotalVendas,
    int QuantidadeVendas,
    DateTimeOffset? DataAbertura
);

public sealed class ObterStatusCaixaUseCase
{
    private readonly IFechamentoCaixaRepository _fechamentoCaixaRepository;

    public ObterStatusCaixaUseCase(IFechamentoCaixaRepository fechamentoCaixaRepository)
    {
        _fechamentoCaixaRepository = fechamentoCaixaRepository ?? throw new ArgumentNullException(nameof(fechamentoCaixaRepository));
    }

    public async Task<StatusCaixaDto> ExecutarAsync(CancellationToken ct = default)
    {
        var caixaAberto = await _fechamentoCaixaRepository.ObterCaixaAbertoAsync(ct);
        if (caixaAberto == null)
        {
            return new StatusCaixaDto("FECHADO", 0m, 0, null);
        }

        return new StatusCaixaDto("ABERTO", caixaAberto.TotalVendas, caixaAberto.QuantidadeVendas, caixaAberto.DataAbertura);
    }
}
