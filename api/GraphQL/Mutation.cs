using BabyTracker.Database.entities;
using BabyTracker.GraphQL.services;
using BabyTracker.GraphQL.types;
using BabyTracker.Infra;
using Microsoft.AspNetCore.Authorization;

namespace BabyTracker.GraphQL;

[Authorize]
public class Mutation
{
    private readonly IBabyEntryService _service;
    private readonly ISleepEntryService _sleepService;
    private readonly IUserContext _context;

    public Mutation(IBabyEntryService service, ISleepEntryService sleepService, IUserContext context)
    {
        _service = service;
        _sleepService = sleepService;
        _context = context;
    }

    /// <summary>
    /// Create a new record
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    public async Task<BabyEntryType> CreateBabyEntry(NewBabyEntryInputType input)
    {
        var userId = _context.GetUserId();
        var entry = await _service.CreateEntryAsync(userId, input);
        return MapToGraphQLType(entry);
    }

    /// <summary>
    /// Update an existing record.
    /// </summary>
    /// <param name="entryId">Id of the existing entry.</param>
    /// <param name="input">Object with the new data.</param>
    /// <returns>New data object when update was successful.</returns>
    public async Task<BabyEntryType> UpdateBabyEntry(string entryId, UpdateBabyEntryInputType input)
    {
        var userId = _context.GetUserId();
        var entry = await _service.UpdateEntryAsync(userId, entryId, input);
        return MapToGraphQLType(entry);
    }

    /// <summary>
    /// Remove an existing entry.
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    public async Task<bool> DeleteBabyEntry(string id)
    {
        var userId = _context.GetUserId();
        return await _service.DeleteEntryAsync(userId, id);
    }

    private BabyEntryType MapToGraphQLType(BabyEntry entry)
    {
        if (entry is null)
            throw new GraphQLException(
                ErrorBuilder.New()
                    .SetMessage("BabyEntry not found.")
                    .SetCode("NOT_FOUND").Build());

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
    /// Create a new sleep entry
    /// </summary>
    /// <param name="input">Sleep entry data</param>
    /// <returns></returns>
    public async Task<SleepEntryType> CreateSleepEntry(NewSleepEntryInputType input)
    {
        var userId = _context.GetUserId();
        var entry = await _sleepService.CreateSleepEntryAsync(userId, input);
        return MapSleepEntryToGraphQLType(entry);
    }

    /// <summary>
    /// Update an existing sleep entry
    /// </summary>
    /// <param name="entryId">ID of the sleep entry to update</param>
    /// <param name="input">Updated sleep entry data</param>
    /// <returns></returns>
    public async Task<SleepEntryType> UpdateSleepEntry(string entryId, UpdateSleepEntryInputType input)
    {
        var userId = _context.GetUserId();
        var entry = await _sleepService.UpdateSleepEntryAsync(userId, entryId, input);
        return MapSleepEntryToGraphQLType(entry);
    }

    /// <summary>
    /// Delete a sleep entry
    /// </summary>
    /// <param name="id">ID of the sleep entry to delete</param>
    /// <returns></returns>
    public async Task<bool> DeleteSleepEntry(string id)
    {
        var userId = _context.GetUserId();
        return await _sleepService.DeleteSleepEntryAsync(userId, id);
    }

    /// <summary>
    /// Stop an active sleep session
    /// </summary>
    /// <param name="sleepId">ID of the active sleep session</param>
    /// <param name="endTime">End time in HH:mm format</param>
    /// <param name="duration">Duration in minutes</param>
    /// <returns></returns>
    public async Task<SleepEntryType> StopSleep(string sleepId, string endTime, int duration)
    {
        var userId = _context.GetUserId();
        var entry = await _sleepService.StopSleepAsync(userId, sleepId, endTime, duration);
        return MapSleepEntryToGraphQLType(entry);
    }

    private static SleepEntryType MapSleepEntryToGraphQLType(SleepEntry entry)
    {
        if (entry is null)
            throw new GraphQLException(
                ErrorBuilder.New()
                    .SetMessage("SleepEntry not found.")
                    .SetCode("NOT_FOUND").Build());

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