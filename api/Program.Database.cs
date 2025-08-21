using BabyTracker.Database.context;
using Microsoft.EntityFrameworkCore;

namespace BabyTracker;

public static class DatabaseExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, ConfigurationManager configuration)
    {
        services.AddDbContext<BabyTrackerDbContext>(options =>
        {
            options.UseSqlServer(configuration.GetConnectionString("BabyTracker")); 
        });

        return services;
    }
}