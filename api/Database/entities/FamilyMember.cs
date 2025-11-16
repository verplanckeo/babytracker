using System.ComponentModel.DataAnnotations;
using BabyTracker.Database.entities.enums;

namespace BabyTracker.Database.entities;

public class FamilyMember
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string FamilyId { get; set; } = string.Empty;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string? Email { get; set; }
    
    public FamilyMemberRole Role { get; set; } = FamilyMemberRole.Parent;
    
    public MembershipStatus Status { get; set; } = MembershipStatus.Pending;
    
    /// <summary>
    /// User ID of who invited this member (null for owner)
    /// </summary>
    public string? InvitedBy { get; set; }
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual Family Family { get; set; } = null!;
}