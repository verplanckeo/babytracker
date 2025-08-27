namespace BabyTracker.GraphQL.types;

public class NewSleepEntryInputType
{
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int? Duration { get; set; }
    public bool IsActive { get; set; }
    public string? Comment { get; set; }
}