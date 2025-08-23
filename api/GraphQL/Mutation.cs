using BabyTracker.Database.entities;
using BabyTracker.GraphQL.types;
using BabyTracker.Infra;
using Microsoft.AspNetCore.Authorization;

namespace BabyTracker.GraphQL;

[Authorize]
public class Mutation
{
    private readonly IBabyEntryService _service;
    private readonly IUserContext _context;

    public Mutation(IBabyEntryService service, IUserContext context)
    {
        _service = service;
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
}