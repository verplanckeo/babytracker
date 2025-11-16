using BabyTracker.Database.entities;
using BabyTracker.GraphQL.services;
using BabyTracker.GraphQL.types;
using BabyTracker.Infra;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/sleep-entries")]
[Authorize]
public class SleepEntriesController : ControllerBase
{
    private readonly ISleepEntryService _service;
    private readonly IUserContext _userContext;

    public SleepEntriesController(ISleepEntryService service, IUserContext userContext)
    {
        _service = service;
        _userContext = userContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<SleepEntryType>>> GetAll([FromQuery] string babyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _service.GetBabySleepEntriesAsync(userId, babyId);
        return Ok(entries.Select(MapToApiModel).ToList());
    }

    [HttpGet("date/{date}")]
    public async Task<ActionResult<List<SleepEntryType>>> GetByDate(string date, [FromQuery] string babyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _service.GetBabySleepEntriesByDateAsync(userId, babyId, date);
        return Ok(entries.Select(MapToApiModel).ToList());
    }

    [HttpGet("range")]
    public async Task<ActionResult<List<SleepEntryType>>> GetByDateRange([FromQuery] string start, [FromQuery] string end, [FromQuery] string babyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _service.GetBabySleepEntriesByDateRangeAsync(userId, babyId, start, end);
        return Ok(entries.Select(MapToApiModel).ToList());
    }

    [HttpGet("active")]
    public async Task<ActionResult<SleepEntryType>> GetActiveSleep([FromQuery] string babyId)
    {
        var userId = _userContext.GetUserId();
        var entry = await _service.GetBabyActiveSleepAsync(userId, babyId);
        if (entry == null) return NotFound();
        return Ok(MapToApiModel(entry));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SleepEntryType>> GetById(string id)
    {
        var userId = _userContext.GetUserId();
        var entry = await _service.GetSleepEntryByIdAsync(userId, id);
        if (entry == null) return NotFound();
        return Ok(MapToApiModel(entry));
    }

    [HttpPost]
    public async Task<ActionResult<SleepEntryType>> Create([FromBody] NewSleepEntryInputType input)
    {
        var userId = _userContext.GetUserId();
        try
        {
            var entry = await _service.CreateSleepEntryAsync(userId, input);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, MapToApiModel(entry));
        }
        catch (InvalidOperationException e)
        {
            return Conflict(new { error = e.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SleepEntryType>> Update(string id, [FromBody] UpdateSleepEntryInputType input)
    {
        var userId = _userContext.GetUserId();
        try
        {
            var entry = await _service.UpdateSleepEntryAsync(userId, id, input);
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
        var deleted = await _service.DeleteSleepEntryAsync(userId, id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/stop")]
    public async Task<ActionResult<SleepEntryType>> StopSleep(string id, [FromBody] StopSleepRequest request)
    {
        var userId = _userContext.GetUserId();
        try
        {
            var entry = await _service.StopSleepAsync(userId, id, request.EndTime, request.Duration);
            return Ok(MapToApiModel(entry));
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
        catch (InvalidOperationException e)
        {
            return Conflict(new { error = e.Message });
        }
    }

    public class StopSleepRequest
    {
        public string EndTime { get; set; }
        public int Duration { get; set; }
    }

    private static SleepEntryType MapToApiModel(SleepEntry entry)
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
            UpdatedAt = entry.UpdatedAt,
        };
    }
}