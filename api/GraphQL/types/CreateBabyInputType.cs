using BabyTracker.Database.entities.enums;

namespace BabyTracker.GraphQL.types;

public class CreateBabyInputType
{
    public string Name { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public Gender Gender { get; set; } = Gender.Unknown;
    public string? Notes { get; set; }
}