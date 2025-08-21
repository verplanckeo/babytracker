using BabyTracker.Database.entities;

namespace BabyTracker.GraphQL.types;

public class UpdateBabyEntryInputType
{
    public string? Date { get; set; }
    public string? Time { get; set; }
    public FeedTypes? FeedType { get; set; }
    public StartingBreastTypes? StartingBreast { get; set; }
    public double? Temperature { get; set; }
    public bool? DidPee { get; set; }
    public bool? DidPoo { get; set; }
    public bool? DidThrowUp { get; set; }
}