using BabyTracker.Database.context;
using BabyTracker.Database.entities;
using BabyTracker.GraphQL.types;
using Microsoft.EntityFrameworkCore;

namespace BabyTracker.GraphQL.services;

public interface ISleepEntryService
{
    Task<List<SleepEntry>> GetSleepEntriesAsync(string userId);
    Task<List<SleepEntry>> GetSleepEntriesByDateAsync(string userId, string date);
    Task<List<SleepEntry>> GetSleepEntriesByDateRangeAsync(string userId, string startDate, string endDate);
    Task<SleepEntry?> GetActiveSleepAsync(string userId);
    Task<SleepEntry> CreateSleepEntryAsync(string userId, NewSleepEntryInputType input);
    Task<SleepEntry> UpdateSleepEntryAsync(string userId, string entryId, UpdateSleepEntryInputType input);
    Task<bool> DeleteSleepEntryAsync(string userId, string entryId);
    Task<SleepEntry?> GetSleepEntryByIdAsync(string userId, string entryId);
    Task<SleepEntry> StopSleepAsync(string userId, string sleepId, string endTime, int duration);
}

public class SleepEntryService : ISleepEntryService
{
    private readonly BabyTrackerDbContext _context;

    public SleepEntryService(BabyTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<List<SleepEntry>> GetSleepEntriesAsync(string userId)
    {
        return await _context.SleepEntries
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<List<SleepEntry>> GetSleepEntriesByDateAsync(string userId, string date)
    {
        return await _context.SleepEntries
            .Where(e => e.UserId == userId && e.Date == DateOnly.Parse(date))
            .OrderBy(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<List<SleepEntry>> GetSleepEntriesByDateRangeAsync(string userId, string startDate, string endDate)
    {
        return await _context.SleepEntries
            .Where(e => e.UserId == userId && 
                       e.Date.CompareTo(DateOnly.Parse(startDate)) >= 0 && 
                       e.Date.CompareTo(DateOnly.Parse(endDate)) <= 0)
            .OrderBy(e => e.Date)
            .ThenBy(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<SleepEntry?> GetActiveSleepAsync(string userId)
    {
        return await _context.SleepEntries
            .Where(e => e.UserId == userId && e.IsActive)
            .OrderByDescending(e => e.Created)
            .FirstOrDefaultAsync();
    }

    public async Task<SleepEntry> CreateSleepEntryAsync(string userId, NewSleepEntryInputType input)
    {
        // Ensure only one active sleep session at a time
        var existingActiveSleep = await GetActiveSleepAsync(userId);
        if (existingActiveSleep != null && input.IsActive)
        {
            throw new InvalidOperationException("There is already an active sleep session. Please end it first.");
        }

        var entry = new SleepEntry
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
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
        return entry;
    }

    public async Task<SleepEntry> UpdateSleepEntryAsync(string userId, string entryId, UpdateSleepEntryInputType input)
    {
        var entry = await _context.SleepEntries
            .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);

        if (entry == null)
            throw new ArgumentException("Sleep entry not found");

        if (input.Date != null) entry.Date = DateOnly.Parse(input.Date);
        if (input.StartTime != null) entry.StartTime = TimeOnly.Parse(input.StartTime);
        if (input.EndTime != null) entry.EndTime = TimeOnly.Parse(input.EndTime);
        if (input.Duration != null) entry.Duration = input.Duration;
        if (input.IsActive != null) entry.IsActive = input.IsActive.Value;
        if (!string.IsNullOrWhiteSpace(input.Comment)) entry.Comment = input.Comment;
        
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<bool> DeleteSleepEntryAsync(string userId, string entryId)
    {
        var entry = await _context.SleepEntries
            .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);

        if (entry == null)
            return false;

        _context.SleepEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<SleepEntry?> GetSleepEntryByIdAsync(string userId, string entryId)
    {
        return await _context.SleepEntries
            .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);
    }

    public async Task<SleepEntry> StopSleepAsync(string userId, string sleepId, string endTime, int duration)
    {
        var entry = await _context.SleepEntries
            .FirstOrDefaultAsync(e => e.Id == sleepId && e.UserId == userId);

        if (entry == null)
            throw new ArgumentException("Sleep entry not found");

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