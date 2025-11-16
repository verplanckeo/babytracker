using BabyTracker.Database.entities.enums;

namespace BabyTracker.GraphQL.types;

public class FamilyInvitationType
{
    public string Id { get; set; } = string.Empty;
    public string FamilyId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string InvitedBy { get; set; } = string.Empty;
    public FamilyMemberRole Role { get; set; }
    public InvitationStatus Status { get; set; }
    public string? Message { get; set; }
    public string InvitationToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime Created { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public FamilyType Family { get; set; } = null!;
}