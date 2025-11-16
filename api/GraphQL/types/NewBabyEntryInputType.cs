using BabyTracker.Database.entities;

namespace BabyTracker.GraphQL.types;

public class NewBabyEntryInputType
{
    public string BabyId { get; set; } = string.Empty; 
    public DateOnly Date { get; set; }
    public TimeOnly Time { get; set; }
    public FeedTypes FeedType { get; set; }
    public StartingBreastTypes? StartingBreast { get; set; }
    public double? Temperature { get; set; }
    public bool DidPee { get; set; }
    public bool DidPoo { get; set; }
    public bool DidThrowUp { get; set; }
    public string? Comment { get; set; }
}