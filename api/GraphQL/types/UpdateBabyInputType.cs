using BabyTracker.Database.entities.enums;

namespace BabyTracker.GraphQL.types;

public class UpdateBabyInputType
{
    public string? Name { get; set; }
    public DateOnly? BirthDate { get; set; }
    public Gender? Gender { get; set; }
    public string? Notes { get; set; }
}