using BabyTracker.Database.entities;
using BabyTracker.GraphQL.services;
using BabyTracker.GraphQL.types;
using BabyTracker.Infra;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/baby-entries")]
[Authorize]
public class BabyEntriesController : ControllerBase
{
    private readonly IBabyEntryService _service;
    private readonly IUserContext _userContext;

    public BabyEntriesController(IBabyEntryService service, IUserContext userContext)
    {
        _service = service;
        _userContext = userContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<BabyEntryType>>> GetAll()
    {
        var userId = _userContext.GetUserId();
        var entries = await _service.GetAllUserEntriesAsync(userId);
        return Ok(entries.Select(MapToApiModel).ToList());
    }

    [HttpGet("date/{date}")]
    public async Task<ActionResult<List<BabyEntryType>>> GetByDate(string date, [FromQuery] string babyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _service.GetBabyEntriesByDateAsync(userId, babyId, date);
        return Ok(entries.Select(MapToApiModel).ToList());
    }

    [HttpGet("range")]
    public async Task<ActionResult<List<BabyEntryType>>> GetByDateRange([FromQuery] string start, [FromQuery] string end, [FromQuery] string babyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _service.GetBabyEntriesByDateRangeAsync(userId, babyId, start, end);
        return Ok(entries.Select(MapToApiModel).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BabyEntryType>> GetById(string id)
    {
        var userId = _userContext.GetUserId();
        var entry = await _service.GetEntryByIdAsync(userId, id);
        if (entry == null) return NotFound();
        return Ok(MapToApiModel(entry));
    }

    [HttpPost]
    public async Task<ActionResult<BabyEntryType>> Create([FromBody] NewBabyEntryInputType input)
    {
        var userId = _userContext.GetUserId();
        var entry = await _service.CreateEntryAsync(userId, input);
        return CreatedAtAction(nameof(GetById), new { id = entry.Id }, MapToApiModel(entry));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BabyEntryType>> Update(string id, [FromBody] UpdateBabyEntryInputType input)
    {
        var userId = _userContext.GetUserId();
        try
        {
            var entry = await _service.UpdateEntryAsync(userId, id, input);
            return Ok(MapToApiModel(entry));
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var userId = _userContext.GetUserId();
        var deleted = await _service.DeleteEntryAsync(userId, id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    private static BabyEntryType MapToApiModel(BabyEntry entry)
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
}