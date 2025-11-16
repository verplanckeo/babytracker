using BabyTracker.Database.services;
using BabyTracker.GraphQL;
using BabyTracker.GraphQL.services;
using BabyTracker.Infra;

namespace BabyTracker;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddDependencyInjectionServices(this IServiceCollection services)
    {
        services.AddScoped<IUserContext, UserContext>();
        services.AddScoped<IBabyEntryService, BabyEntryService>();
        services.AddScoped<ISleepEntryService, SleepEntryService>();
        services.AddScoped<IFamilyService, FamilyService>();
        services.AddScoped<IDataMigrationService, DataMigrationService>();

        services.AddScoped<Query>();
        services.AddScoped<Mutation>();

        return services;
    }
}