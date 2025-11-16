using BabyTracker.Database.entities.enums;

namespace BabyTracker.GraphQL.types;

public class BabyType
{
    public string Id { get; set; } = string.Empty;
    public string FamilyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public Gender Gender { get; set; }
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime Created { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public FamilyType Family { get; set; } = null!;
}