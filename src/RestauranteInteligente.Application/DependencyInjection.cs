using Microsoft.Extensions.DependencyInjection;
using RestauranteInteligente.Application.Estoque.Services;

namespace RestauranteInteligente.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<BaixaEstoqueService>();
        return services;
    }
}
