
using BabyTracker.Database.context;
using BabyTracker.Database.entities;
using BabyTracker.Database.entities.enums;
using BabyTracker.GraphQL.services;
using BabyTracker.GraphQL.types;
using Microsoft.EntityFrameworkCore;

public interface IBabyEntryService
{
    // Updated methods to work with baby-specific data
    Task<List<BabyEntry>> GetBabyEntriesAsync(string userId, string babyId);
    Task<List<BabyEntry>> GetBabyEntriesByDateAsync(string userId, string babyId, string date);
    Task<List<BabyEntry>> GetBabyEntriesByDateRangeAsync(string userId, string babyId, string startDate, string endDate);
    Task<List<BabyEntry>> GetFamilyEntriesAsync(string userId, string familyId);
    Task<List<BabyEntry>> GetAllUserEntriesAsync(string userId); // All entries across all families
    Task<BabyEntry> CreateEntryAsync(string userId, NewBabyEntryInputType input);
    Task<BabyEntry> UpdateEntryAsync(string userId, string entryId, UpdateBabyEntryInputType input);
    Task<bool> DeleteEntryAsync(string userId, string entryId);
    Task<BabyEntry?> GetEntryByIdAsync(string userId, string entryId);
}

   public class BabyEntryService : IBabyEntryService
{
    private readonly BabyTrackerDbContext _context;
    private readonly IFamilyService _familyService;

    public BabyEntryService(BabyTrackerDbContext context, IFamilyService familyService)
    {
        _context = context;
        _familyService = familyService;
    }

    public async Task<List<BabyEntry>> GetBabyEntriesAsync(string userId, string babyId)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, babyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        return await _context.BabyEntries
            .Where(e => e.BabyId == babyId)
            .Include(e => e.Baby)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.Time)
            .ToListAsync();
    }

    public async Task<List<BabyEntry>> GetBabyEntriesByDateAsync(string userId, string babyId, string date)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, babyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        return await _context.BabyEntries
            .Where(e => e.BabyId == babyId && e.Date == DateOnly.Parse(date))
            .Include(e => e.Baby)
            .OrderBy(e => e.Time)
            .ToListAsync();
    }

    public async Task<List<BabyEntry>> GetBabyEntriesByDateRangeAsync(string userId, string babyId, string startDate, string endDate)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, babyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        return await _context.BabyEntries
            .Where(e => e.BabyId == babyId && 
                       e.Date.CompareTo(DateOnly.Parse(startDate)) >= 0 && 
                       e.Date.CompareTo(DateOnly.Parse(endDate)) <= 0)
            .Include(e => e.Baby)
            .OrderBy(e => e.Date)
            .ThenBy(e => e.Time)
            .ToListAsync();
    }

    public async Task<List<BabyEntry>> GetFamilyEntriesAsync(string userId, string familyId)
    {
        var isAuthorized = await _familyService.IsUserFamilyMemberAsync(userId, familyId);
        if (!isAuthorized)
            throw new UnauthorizedAccessException("User is not a member of this family");

        return await _context.BabyEntries
            .Where(e => e.Baby.FamilyId == familyId)
            .Include(e => e.Baby)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.Time)
            .ToListAsync();
    }

    public async Task<List<BabyEntry>> GetAllUserEntriesAsync(string userId)
    {
        var userFamilyIds = await _context.FamilyMembers
            .Where(fm => fm.UserId == userId && fm.Status == MembershipStatus.Active)
            .Select(fm => fm.FamilyId)
            .ToListAsync();

        return await _context.BabyEntries
            .Where(e => userFamilyIds.Contains(e.Baby.FamilyId))
            .Include(e => e.Baby)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.Time)
            .ToListAsync();
    }

    public async Task<BabyEntry> CreateEntryAsync(string userId, NewBabyEntryInputType input)
    {
        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, input.BabyId);
        if (!canAccess)
            throw new UnauthorizedAccessException("User cannot access this baby's data");

        var entry = new BabyEntry
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            BabyId = input.BabyId,
            Date = input.Date,
            Time = input.Time,
            FeedType = input.FeedType,
            StartingBreast = input.StartingBreast,
            Temperature = input.Temperature,
            DidPee = input.DidPee,
            DidPoo = input.DidPoo,
            DidThrowUp = input.DidThrowUp,
            Comment = input.Comment,
            Created = DateTime.UtcNow
        };

        _context.BabyEntries.Add(entry);
        await _context.SaveChangesAsync();

        // Reload with includes
        return await _context.BabyEntries
            .Include(e => e.Baby)
            .FirstAsync(e => e.Id == entry.Id);
    }

    public async Task<BabyEntry> UpdateEntryAsync(string userId, string entryId, UpdateBabyEntryInputType input)
    {
        var entry = await _context.BabyEntries
            .Include(e => e.Baby)
            .FirstOrDefaultAsync(e => e.Id == entryId);

        if (entry == null)
            throw new ArgumentException("Entry not found");

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
        if (input.Time != null) entry.Time = TimeOnly.Parse(input.Time);
        if (input.FeedType != null) entry.FeedType = input.FeedType.Value;
        if (input.StartingBreast != null) entry.StartingBreast = input.StartingBreast;
        if (input.Temperature != null) entry.Temperature = input.Temperature;
        if (input.DidPee != null) entry.DidPee = input.DidPee.Value;
        if (input.DidPoo != null) entry.DidPoo = input.DidPoo.Value;
        if (input.DidThrowUp != null) entry.DidThrowUp = input.DidThrowUp.Value;
        if (input.Comment != null) entry.Comment = input.Comment;
        
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<bool> DeleteEntryAsync(string userId, string entryId)
    {
        var entry = await _context.BabyEntries
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

        _context.BabyEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<BabyEntry?> GetEntryByIdAsync(string userId, string entryId)
    {
        var entry = await _context.BabyEntries
            .Include(e => e.Baby)
            .FirstOrDefaultAsync(e => e.Id == entryId);

        if (entry == null)
            return null;

        var canAccess = await _familyService.CanUserAccessBabyAsync(userId, entry.BabyId);
        if (!canAccess)
            return null;

        return entry;
    }
}