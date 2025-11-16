using BabyTracker.Database.entities.enums;

namespace BabyTracker.GraphQL.types;

public class UpdateMemberInputType
{
    public string? DisplayName { get; set; }
    public FamilyMemberRole? Role { get; set; }
}