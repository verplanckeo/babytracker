using BabyTracker.GraphQL;
using HotChocolate.AspNetCore;

namespace BabyTracker;

public static class Program_GraphQL
{
    public static IServiceCollection AddGraphQL(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddGraphQLServer()
            .AddAuthorization()
            .AddQueryType<Query>()
            .AddMutationType<Mutation>()
            .AddProjections() // these require Hotchocolate.Data nuget package
            .AddFiltering() // these require Hotchocolate.Data nuget package
            .AddSorting(); // these require Hotchocolate.Data nuget package
        
        return services;
    }
    
    /// <summary>
    /// Configure GraphQL endpoint
    /// </summary>
    /// <param name="app"></param>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static WebApplication ApplyGraphQL(this WebApplication app, IConfiguration configuration)
    {
        app.MapGraphQL("/graphql")
            .WithOptions(new GraphQLServerOptions
            {
                Tool =
                {
                    Enable = true, // Enable in both dev and prod
                    Title = "Baby Tracker GraphQL API",
                    Document =
                        "Welcome to the Baby Tracker GraphQL API. Use the authentication button to sign in with Azure Entra ID.",
                }
            });
        return app;
    }
}