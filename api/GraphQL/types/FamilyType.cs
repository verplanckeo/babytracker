namespace BabyTracker.GraphQL.types;

public class FamilyType
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public DateTime Created { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<FamilyMemberType> Members { get; set; } = new();
    public List<BabyType> Babies { get; set; } = new();
}