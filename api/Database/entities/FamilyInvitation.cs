using System.ComponentModel.DataAnnotations;
using BabyTracker.Database.entities.enums;

namespace BabyTracker.Database.entities;

public class FamilyInvitation
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string FamilyId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string InvitedBy { get; set; } = string.Empty;
    
    public FamilyMemberRole Role { get; set; } = FamilyMemberRole.Parent;
    
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
    
    [MaxLength(500)]
    public string? Message { get; set; }
    
    /// <summary>
    /// Unique token for invitation acceptance
    /// </summary>
    [Required]
    public string InvitationToken { get; set; } = Guid.NewGuid().ToString();
    
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual Family Family { get; set; } = null!;
}