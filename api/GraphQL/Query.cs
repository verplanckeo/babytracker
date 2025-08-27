using System.Security.Claims;
using BabyTracker.Database.entities;
using BabyTracker.GraphQL.services;
using BabyTracker.GraphQL.types;
using BabyTracker.Infra;
using Microsoft.AspNetCore.Authorization;

namespace BabyTracker.GraphQL;

[Authorize]
public class Query
{
    private readonly IBabyEntryService _service;
    private readonly IUserContext _context;

    public Query(IBabyEntryService service, IUserContext context)
    {
        _service = service;
        _context = context;
    }

    /// <summary>
    /// Get all entries related to the user.
    /// </summary>
    /// <returns></returns>
    public async Task<List<BabyEntryType>> GetBabyEntries()
    {
        var userId = _context.GetUserId();
        var entries = await _service.GetEntriesAsync(userId);
        return entries.Select(MapToGraphQLType).ToList();
    }

    /// <summary>
    /// Get all entries related to the authenticated user of a specific day
    /// </summary>
    /// <param name="date">Entries of the day in question (yyyy-MM-dd)</param>
    /// <returns></returns>
    public async Task<List<BabyEntryType>> GetBabyEntriesByDate(
        string date)
    {
        var userId = _context.GetUserId();
        var entries = await _service.GetEntriesByDateAsync(userId, date);
        return entries.Select(MapToGraphQLType).ToList();
    }

    /// <summary>
    /// Get entries between a specific date range.
    /// </summary>
    /// <param name="startDate">From when</param>
    /// <param name="endDate">Until when</param>
    /// <returns>A list of entries.</returns>
    public async Task<List<BabyEntryType>> GetBabyEntriesByDateRange(
        string startDate,
        string endDate)
    {
        var userId = _context.GetUserId();
        var entries = await _service.GetEntriesByDateRangeAsync(userId, startDate, endDate);
        return entries.Select(MapToGraphQLType).ToList();
    }

    /// <summary>
    /// Get one specific entry.
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    public async Task<BabyEntryType?> GetBabyEntry(
        string id)
    {
        var userId = _context.GetUserId();
        var entry = await _service.GetEntryByIdAsync(userId, id);
        return entry != null ? MapToGraphQLType(entry) : null;
    }

    private BabyEntryType MapToGraphQLType(BabyEntry entry)
    {
        return new BabyEntryType
        {
            Id = entry.Id,
            Date = entry.Date,
            Time = entry.Time,
            FeedType = entry.FeedType,
            StartingBreast = entry.StartingBreast,
            Temperature = entry.Temperature,
            DidPee = entry.DidPee,
            DidPoo = entry.DidPoo,
            DidThrowUp = entry.DidThrowUp,
            Created = entry.Created,
            UpdatedAt = entry.UpdatedAt,
            Comment = entry.Comment,
        };
    }

    /// <summary>
    /// Get all sleep entries for the current user
    /// </summary>
    /// <returns></returns>
    public async Task<List<SleepEntryType>> SleepEntries([Service] ISleepEntryService sleepService,
        [Service] IUserContext userContext)
    {
        var userId = userContext.GetUserId();
        var entries = await sleepService.GetSleepEntriesAsync(userId);
        return entries.Select(MapSleepEntryToGraphQLType).ToList();
    }

    /// <summary>
    /// Get sleep entries for a specific date
    /// </summary>
    /// <param name="date">Date in YYYY-MM-DD format</param>
    /// <returns></returns>
    public async Task<List<SleepEntryType>> SleepEntriesByDate(string date, [Service] ISleepEntryService sleepService,
        [Service] IUserContext userContext)
    {
        var userId = userContext.GetUserId();
        var entries = await sleepService.GetSleepEntriesByDateAsync(userId, date);
        return entries.Select(MapSleepEntryToGraphQLType).ToList();
    }

    /// <summary>
    /// Get sleep entries within a date range
    /// </summary>
    /// <param name="startDate">Start date in YYYY-MM-DD format</param>
    /// <param name="endDate">End date in YYYY-MM-DD format</param>
    /// <returns></returns>
    public async Task<List<SleepEntryType>> SleepEntriesByDateRange(string startDate, string endDate,
        [Service] ISleepEntryService sleepService, [Service] IUserContext userContext)
    {
        var userId = userContext.GetUserId();
        var entries = await sleepService.GetSleepEntriesByDateRangeAsync(userId, startDate, endDate);
        return entries.Select(MapSleepEntryToGraphQLType).ToList();
    }

    /// <summary>
    /// Get the currently active sleep session
    /// </summary>
    /// <returns></returns>
    public async Task<SleepEntryType?> ActiveSleep([Service] ISleepEntryService sleepService,
        [Service] IUserContext userContext)
    {
        var userId = userContext.GetUserId();
        var activeSleep = await sleepService.GetActiveSleepAsync(userId);
        return activeSleep != null ? MapSleepEntryToGraphQLType(activeSleep) : null;
    }

    /// <summary>
    /// Get a specific sleep entry by ID
    /// </summary>
    /// <param name="id">Sleep entry ID</param>
    /// <returns></returns>
    public async Task<SleepEntryType?> SleepEntry(string id, [Service] ISleepEntryService sleepService,
        [Service] IUserContext userContext)
    {
        var userId = userContext.GetUserId();
        var entry = await sleepService.GetSleepEntryByIdAsync(userId, id);
        return entry != null ? MapSleepEntryToGraphQLType(entry) : null;
    }

    private static SleepEntryType MapSleepEntryToGraphQLType(SleepEntry entry)
    {
        return new SleepEntryType
        {
            Id = entry.Id,
            Date = entry.Date,
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            Duration = entry.Duration,
            IsActive = entry.IsActive,
            Comment = entry.Comment,
            Created = entry.Created,
            UpdatedAt = entry.UpdatedAt
        };
    }
}