namespace BabyTracker.GraphQL.types;

public class SleepEntryType
{
    public string Id { get; set; } = string.Empty;
    public string BabyId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int? Duration { get; set; }
    public bool IsActive { get; set; }
    public string? Comment { get; set; }
    public DateTime Created { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public BabyType Baby { get; set; } = null!;
    
    public string CreatedByDisplayName { get; set; } = string.Empty;
}