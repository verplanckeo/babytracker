using BabyTracker.Database.context;
using BabyTracker.Database.entities;
using BabyTracker.Database.entities.enums;
using Microsoft.EntityFrameworkCore;

namespace BabyTracker.Database.services;

public interface IDataMigrationService
{
    Task MigrateExistingDataToFamilyStructureAsync();
    Task<bool> HasMigrationBeenExecutedAsync();
}

public class DataMigrationService : IDataMigrationService
{
    private readonly BabyTrackerDbContext _context;
    private readonly ILogger<DataMigrationService> _logger;

    public DataMigrationService(BabyTrackerDbContext context, ILogger<DataMigrationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> HasMigrationBeenExecutedAsync()
    {
        // Check if any babies exist (indicating migration has been run)
        return await _context.Babies.AnyAsync();
    }

    public async Task MigrateExistingDataToFamilyStructureAsync()
    {
        try
        {
            _logger.LogInformation("Starting data migration to family structure...");

            // Get all unique user IDs from existing data
            var userIdsFromBabyEntries = await _context.BabyEntries
                .Select(x => x.UserId)
                .Distinct()
                .ToListAsync();

            var userIdsFromSleepEntries = await _context.SleepEntries
                .Select(x => x.UserId)
                .Distinct()
                .ToListAsync();

            var allUserIds = userIdsFromBabyEntries
                .Union(userIdsFromSleepEntries)
                .Distinct()
                .ToList();

            _logger.LogInformation($"Found {allUserIds.Count} unique users to migrate");

            foreach (var userId in allUserIds)
            {
                await MigrateUserDataAsync(userId);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Data migration completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during data migration");
            throw;
        }
    }

    private async Task MigrateUserDataAsync(string userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Create a family for this user
            var family = new Family
            {
                Id = Guid.NewGuid().ToString(),
                Name = "My Family", // Default name, user can change later
                OwnerId = userId,
                Created = DateTime.UtcNow
            };

            _context.Families.Add(family);

            // Create family member entry for the owner
            var familyMember = new FamilyMember
            {
                Id = Guid.NewGuid().ToString(),
                FamilyId = family.Id,
                UserId = userId,
                DisplayName = "You (default)", // Default display name
                Role = FamilyMemberRole.Owner,
                Status = MembershipStatus.Active,
                Created = DateTime.UtcNow
            };

            _context.FamilyMembers.Add(familyMember);

            // Create a default baby for this family
            var baby = new Baby
            {
                Id = Guid.NewGuid().ToString(),
                FamilyId = family.Id,
                Name = "Baby", // Default name, user can change later
                CreatedBy = userId,
                Created = DateTime.UtcNow
            };

            _context.Babies.Add(baby);

            // Update all existing BabyEntries for this user
            var babyEntries = await _context.BabyEntries
                .Where(x => x.UserId == userId)
                .ToListAsync();

            foreach (var entry in babyEntries)
            {
                entry.BabyId = baby.Id;
            }

            // Update all existing SleepEntries for this user
            var sleepEntries = await _context.SleepEntries
                .Where(x => x.UserId == userId)
                .ToListAsync();

            foreach (var entry in sleepEntries)
            {
                entry.BabyId = baby.Id;
            }

            await transaction.CommitAsync();
            _logger.LogInformation($"Successfully migrated data for user {userId}");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, $"Error migrating data for user {userId}");
            throw;
        }
    }
}