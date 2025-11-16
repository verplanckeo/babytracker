namespace BabyTracker.GraphQL.types;

public class UpdateSleepEntryInputType
{
    public string? BabyId { get; set; }
    public string? Date { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public int? Duration { get; set; }
    public bool? IsActive { get; set; }
    public string? Comment { get; set; }
}