using BabyTracker.Database.entities.enums;

namespace BabyTracker.GraphQL.types;

public class FamilyMemberType
{
    public string Id { get; set; } = string.Empty;
    public string FamilyId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public FamilyMemberRole Role { get; set; }
    public MembershipStatus Status { get; set; }
    public string? InvitedBy { get; set; }
    public DateTime Created { get; set; }
    public DateTime? UpdatedAt { get; set; }
}