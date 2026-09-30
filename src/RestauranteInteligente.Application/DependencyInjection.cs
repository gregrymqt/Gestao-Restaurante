using Microsoft.Extensions.DependencyInjection;
using RestauranteInteligente.Application.Assinaturas.UseCases;
using RestauranteInteligente.Application.Auth.UseCases;
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
        services.AddScoped<CadastrarRestauranteUseCase>();
        services.AddScoped<ObterStatusAssinaturaUseCase>();
        services.AddScoped<AtivarAssinaturaPlanoUseCase>();
        return services;
    }
}
