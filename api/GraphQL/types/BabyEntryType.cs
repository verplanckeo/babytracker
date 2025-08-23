using BabyTracker.Database.entities;

namespace BabyTracker.GraphQL.types;

public class BabyEntryType
{
    public string Id { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly Time { get; set; }
    public FeedTypes FeedType { get; set; }
    public StartingBreastTypes? StartingBreast { get; set; }
    public double? Temperature { get; set; }
    public bool DidPee { get; set; }
    public bool DidPoo { get; set; }
    public bool DidThrowUp { get; set; }
    
    public string Comment { get; set; }
    public DateTimeOffset Created { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}