using BabyTracker.Database.context;
using BabyTracker.Database.entities;
using BabyTracker.Database.entities.enums;
using BabyTracker.GraphQL.types;
using Microsoft.EntityFrameworkCore;

namespace BabyTracker.GraphQL.services;

public interface ISleepEntryService
{
    Task<List<SleepEntry>> GetBabySleepEntriesAsync(string userId, string babyId);
    Task<List<SleepEntry>> GetBabySleepEntriesByDateAsync(string userId, string babyId, string date);
    Task<List<SleepEntry>> GetBabySleepEntriesByDateRangeAsync(string userId, string babyId, string startDate, string endDate);
    Task<List<SleepEntry>> GetFamilySleepEntriesAsync(string userId, string familyId);
    Task<List<SleepEntry>> GetAllUserSleepEntriesAsync(string userId);
    Task<SleepEntry?> GetBabyActiveSleepAsync(string userId, string babyId);
    Task<SleepEntry> CreateSleepEntryAsync(string userId, NewSleepEntryInputType input);
    Task<SleepEntry> UpdateSleepEntryAsync(string userId, string entryId, UpdateSleepEntryInputType input);
    Task<bool> DeleteSleepEntryAsync(string userId, string entryId);
    Task<SleepEntry?> GetSleepEntryByIdAsync(string userId, string entryId);
    Task<SleepEntry> StopSleepAsync(string userId, string sleepId, string endTime, int duration);
}

public class SleepEntryService : ISleepEntryService
{
    private readonly BabyTrackerDbContext _context;
    private readonly IFamilyService _familyService;

    public SleepEntryService(BabyTrackerDbContext context, IFamilyService familyService)
    {
        _context = context;
        _familyService = familyService;
    }

    public async Task<List<SleepEntry>> GetBabySleepEntriesAsync(string userId, string babyId)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, babyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        return await _context.SleepEntries
            .Where(e => e.BabyId == babyId)
            .Include(e => e.Baby)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<List<SleepEntry>> GetBabySleepEntriesByDateAsync(string userId, string babyId, string date)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, babyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        return await _context.SleepEntries
            .Where(e => e.BabyId == babyId && e.Date == DateOnly.Parse(date))
            .Include(e => e.Baby)
            .OrderBy(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<List<SleepEntry>> GetBabySleepEntriesByDateRangeAsync(string userId, string babyId, string startDate, string endDate)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, babyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        return await _context.SleepEntries
            .Where(e => e.BabyId == babyId && 
                       e.Date.CompareTo(DateOnly.Parse(startDate)) >= 0 && 
                       e.Date.CompareTo(DateOnly.Parse(endDate)) <= 0)
            .Include(e => e.Baby)
            .OrderBy(e => e.Date)
            .ThenBy(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<List<SleepEntry>> GetFamilySleepEntriesAsync(string userId, string familyId)
    {
        var isAuthorized = await _familyService.IsUserFamilyMemberAsync(userId, familyId);
        if (!isAuthorized)
            throw new UnauthorizedAccessException("User is not a member of this family");

        return await _context.SleepEntries
            .Where(e => e.Baby.FamilyId == familyId)
            .Include(e => e.Baby)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<List<SleepEntry>> GetAllUserSleepEntriesAsync(string userId)
    {
        var userFamilyIds = await _context.FamilyMembers
            .Where(fm => fm.UserId == userId && fm.Status == MembershipStatus.Active)
            .Select(fm => fm.FamilyId)
            .ToListAsync();

        return await _context.SleepEntries
            .Where(e => userFamilyIds.Contains(e.Baby.FamilyId))
            .Include(e => e.Baby)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<SleepEntry?> GetBabyActiveSleepAsync(string userId, string babyId)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, babyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        return await _context.SleepEntries
            .Where(e => e.BabyId == babyId && e.IsActive)
            .Include(e => e.Baby)
            .OrderByDescending(e => e.Created)
            .FirstOrDefaultAsync();
    }

    public async Task<SleepEntry> CreateSleepEntryAsync(string userId, NewSleepEntryInputType input)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, input.BabyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        // Ensure only one active sleep session per baby at a time
        var existingActiveSleep = await GetBabyActiveSleepAsync(userId, input.BabyId);
        if (existingActiveSleep != null && input.IsActive)
        {
            throw new InvalidOperationException("There is already an active sleep session for this baby. Please end it first.");
        }

        var entry = new SleepEntry
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            BabyId = input.BabyId,
            Date = input.Date,
            StartTime = input.StartTime,
            EndTime = input.EndTime,
            Duration = input.Duration,
            IsActive = input.IsActive,
            Comment = input.Comment,
            Created = DateTime.UtcNow
        };

        _context.SleepEntries.Add(entry);
        await _context.SaveChangesAsync();

        // Reload with includes
        return await _context.SleepEntries
            .Include(e => e.Baby)
            .FirstAsync(e => e.Id == entry.Id);
    }

    public async Task<SleepEntry> UpdateSleepEntryAsync(string userId, string entryId, UpdateSleepEntryInputType input)
    {
        var entry = await _context.SleepEntries
            .Include(e => e.Baby)
            .FirstOrDefaultAsync(e => e.Id == entryId);

        if (entry == null)
            throw new ArgumentException("Sleep entry not found");

        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, entry.BabyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        // Only allow the creator or family owner to edit
        var isOwner = await _familyService.IsUserFamilyOwnerAsync(userId, entry.Baby.FamilyId);
        if (entry.UserId != userId && !isOwner)
            throw new UnauthorizedAccessException("Only the entry creator or family owner can edit this entry");

        if (input.BabyId != null && input.BabyId != entry.BabyId)
        {
            var canAccessNewBaby = await _familyService.CanUserAccessBabyAsync(userId, input.BabyId);
            if (!canAccessNewBaby)
                throw new UnauthorizedAccessException("User cannot move entry to this baby");
            entry.BabyId = input.BabyId;
        }

        if (input.Date != null) entry.Date = DateOnly.Parse(input.Date);
        if (input.StartTime != null) entry.StartTime = TimeOnly.Parse(input.StartTime);
        if (input.EndTime != null) entry.EndTime = TimeOnly.Parse(input.EndTime);
        if (input.Duration != null) entry.Duration = input.Duration;
        if (input.IsActive != null) entry.IsActive = input.IsActive.Value;
        if (input.Comment != null) entry.Comment = input.Comment;
        
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<bool> DeleteSleepEntryAsync(string userId, string entryId)
    {
        var entry = await _context.SleepEntries
            .Include(e => e.Baby)
            .FirstOrDefaultAsync(e => e.Id == entryId);

        if (entry == null)
            return false;

        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, entry.BabyId);
        if (!canAccess)
            return false;

        // Only allow the creator or family owner to delete
        var isOwner = await _familyService.IsUserFamilyOwnerAsync(userId, entry.Baby.FamilyId);
        if (entry.UserId != userId && !isOwner)
            throw new UnauthorizedAccessException("Only the entry creator or family owner can delete this entry");

        _context.SleepEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<SleepEntry?> GetSleepEntryByIdAsync(string userId, string entryId)
    {
        var entry = await _context.SleepEntries
            .Include(e => e.Baby)
            .FirstOrDefaultAsync(e => e.Id == entryId);

        if (entry == null)
            return null;

        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, entry.BabyId);
        if (!canAccess)
            return null;

        return entry;
    }

    public async Task<SleepEntry> StopSleepAsync(string userId, string sleepId, string endTime, int duration)
    {
        var entry = await _context.SleepEntries
            .Include(e => e.Baby)
            .FirstOrDefaultAsync(e => e.Id == sleepId);

        if (entry == null)
            throw new ArgumentException("Sleep entry not found");

        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, entry.BabyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        if (!entry.IsActive)
            throw new InvalidOperationException("Sleep session is not active");

        entry.EndTime = TimeOnly.Parse(endTime);
        entry.Duration = duration;
        entry.IsActive = false;
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return entry;
    }
}