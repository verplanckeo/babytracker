using System.Security.Claims;
using BabyTracker.Database.entities;
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
            UpdatedAt = entry.UpdatedAt
        };
    }
}