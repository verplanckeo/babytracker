
using BabyTracker.Database.context;
using BabyTracker.Database.entities;
using BabyTracker.GraphQL.types;
using Microsoft.EntityFrameworkCore;

public interface IBabyEntryService
    {
        Task<List<BabyEntry>> GetEntriesAsync(string userId);
        Task<List<BabyEntry>> GetEntriesByDateAsync(string userId, string date);
        Task<List<BabyEntry>> GetEntriesByDateRangeAsync(string userId, string startDate, string endDate);
        Task<BabyEntry> CreateEntryAsync(string userId, NewBabyEntryInputType input);
        Task<BabyEntry> UpdateEntryAsync(string userId, string entryId, UpdateBabyEntryInputType input);
        Task<bool> DeleteEntryAsync(string userId, string entryId);
        Task<BabyEntry?> GetEntryByIdAsync(string userId, string entryId);
    }

    public class BabyEntryService : IBabyEntryService
    {
        private readonly BabyTrackerDbContext _context;

        public BabyEntryService(BabyTrackerDbContext context)
        {
            _context = context;
        }

        public async Task<List<BabyEntry>> GetEntriesAsync(string userId)
        {
            return await _context.BabyEntries
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.Time)
                .ToListAsync();
        }

        public async Task<List<BabyEntry>> GetEntriesByDateAsync(string userId, string date)
        {
            return await _context.BabyEntries
                .Where(e => e.UserId == userId && e.Date == DateOnly.Parse(date))
                .OrderBy(e => e.Time)
                .ToListAsync();
        }

        public async Task<List<BabyEntry>> GetEntriesByDateRangeAsync(string userId, string startDate, string endDate)
        {
            return await _context.BabyEntries
                .Where(e => e.UserId == userId && 
                           e.Date.CompareTo(DateOnly.Parse(startDate)) >= 0 && 
                           e.Date.CompareTo(DateOnly.Parse(endDate)) <= 0)
                .OrderBy(e => e.Date)
                .ThenBy(e => e.Time)
                .ToListAsync();
        }

        public async Task<BabyEntry> CreateEntryAsync(string userId, NewBabyEntryInputType input)
        {
            var entry = new BabyEntry
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Date = input.Date,
                Time = input.Time,
                FeedType = input.FeedType,
                StartingBreast = input.StartingBreast,
                Temperature = input.Temperature,
                DidPee = input.DidPee,
                DidPoo = input.DidPoo,
                DidThrowUp = input.DidThrowUp,
                Created = DateTime.UtcNow,
                Comment = input.Comment
            };

            _context.BabyEntries.Add(entry);
            await _context.SaveChangesAsync();
            return entry;
        }

        public async Task<BabyEntry> UpdateEntryAsync(string userId, string entryId, UpdateBabyEntryInputType input)
        {
            var entry = await _context.BabyEntries
                .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);

            if (entry == null)
                throw new ArgumentException("Entry not found");

            if (input.Date != null) entry.Date = DateOnly.Parse(input.Date);
            if (input.Time != null) entry.Time = TimeOnly.Parse(input.Time);
            if (input.FeedType != null) entry.FeedType = input.FeedType.Value;
            if (input.StartingBreast != null) entry.StartingBreast = input.StartingBreast;
            if (input.Temperature != null) entry.Temperature = input.Temperature;
            if (input.DidPee != null) entry.DidPee = input.DidPee.Value;
            if (input.DidPoo != null) entry.DidPoo = input.DidPoo.Value;
            if (input.DidThrowUp != null) entry.DidThrowUp = input.DidThrowUp.Value;
            if (!string.IsNullOrWhiteSpace(input.Comment)) entry.Comment = input.Comment;
            
            entry.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return entry;
        }

        public async Task<bool> DeleteEntryAsync(string userId, string entryId)
        {
            var entry = await _context.BabyEntries
                .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);

            if (entry == null)
                return false;

            _context.BabyEntries.Remove(entry);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<BabyEntry?> GetEntryByIdAsync(string userId, string entryId)
        {
            return await _context.BabyEntries
                .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);
        }
    }