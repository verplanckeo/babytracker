using BabyTracker.Database.context;
using BabyTracker.Database.services;
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

    public static async Task<WebApplication> ApplyDatabaseMigration(this WebApplication app)
    {
        // Ensure database is created and migrations are applied
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BabyTrackerDbContext>();
        var migrationService = scope.ServiceProvider.GetRequiredService<IDataMigrationService>();
    
        try
        {
            // Apply pending migrations
            await context.Database.MigrateAsync();
        
            // Check if data migration is needed
            var migrationNeeded = !await migrationService.HasMigrationBeenExecutedAsync();
        
            if (migrationNeeded)
            {
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogInformation("Starting data migration to family structure...");
            
                await migrationService.MigrateExistingDataToFamilyStructureAsync();
            
                logger.LogInformation("Data migration completed successfully");
            }
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while migrating the database");
            throw;
        }

        return app;
    }
}