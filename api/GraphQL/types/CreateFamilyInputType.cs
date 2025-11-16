namespace BabyTracker.GraphQL.types;

public class CreateFamilyInputType
{
    public string Name { get; set; } = string.Empty;
    public string? OwnerDisplayName { get; set; }
}