using Microsoft.Extensions.DependencyInjection;
using RestauranteInteligente.Application.Caixa.UseCases;
using RestauranteInteligente.Application.Estoque.Services;
using RestauranteInteligente.Application.Previsoes.UseCases;
using RestauranteInteligente.Application.Vendas.UseCases;

namespace RestauranteInteligente.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<BaixaEstoqueService>();
        services.AddScoped<RegistrarVendaUseCase>();
        services.AddScoped<AbrirCaixaUseCase>();
        services.AddScoped<FecharCaixaUseCase>();
        services.AddScoped<CalcularCapacidadeProducaoUseCase>();
        return services;
    }
}
