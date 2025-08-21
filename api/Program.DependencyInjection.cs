using BabyTracker.GraphQL;
using BabyTracker.Infra;

namespace BabyTracker;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddDependencyInjectionServices(this IServiceCollection services)
    {
        services.AddScoped<IUserContext, UserContext>();
        services.AddScoped<IBabyEntryService, BabyEntryService>();

        services.AddScoped<Query>();
        services.AddScoped<Mutation>();

        return services;
    }
}