using BabyTracker.Database.entities.enums;

namespace BabyTracker.GraphQL.types;

public class InviteMemberInputType
{
    public string Email { get; set; } = string.Empty;
    public FamilyMemberRole Role { get; set; } = FamilyMemberRole.Parent;
    public string? Message { get; set; }
}