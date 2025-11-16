using System.ComponentModel.DataAnnotations;
using BabyTracker.Database.entities.enums;

namespace BabyTracker.Database.entities;

/// <summary>
/// This is the baby class - to register a baby to a family. This is the person.
/// </summary>
public class Baby
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string FamilyId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    public DateOnly? BirthDate { get; set; }
    
    public Gender Gender { get; set; } = Gender.Unknown;
    
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    /// <summary>
    /// User ID of who created this baby profile
    /// </summary>
    [Required]
    public string CreatedBy { get; set; } = string.Empty;
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual Family Family { get; set; } = null!;
    public virtual ICollection<BabyEntry> BabyEntries { get; set; } = new List<BabyEntry>();
    public virtual ICollection<SleepEntry> SleepEntries { get; set; } = new List<SleepEntry>();
}