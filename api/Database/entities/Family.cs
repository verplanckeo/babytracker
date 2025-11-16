using System.ComponentModel.DataAnnotations;

namespace BabyTracker.Database.entities;

public class Family
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// User ID of the family owner (person who created the family)
    /// </summary>
    [Required]
    public string OwnerId { get; set; } = string.Empty;
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<FamilyMember> Members { get; set; } = new List<FamilyMember>();
    public virtual ICollection<Baby> Babies { get; set; } = new List<Baby>();
}