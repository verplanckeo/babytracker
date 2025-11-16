using System.ComponentModel.DataAnnotations;

namespace BabyTracker.Database.entities;

public class SleepEntry
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Baby this sleep entry belongs to
    /// </summary>
    //[Required]
    public string? BabyId { get; set; } = string.Empty;
    
    [Required]
    public DateOnly Date { get; set; }
    
    [Required]
    public TimeOnly StartTime { get; set; }
    
    public TimeOnly? EndTime { get; set; }
    
    /// <summary>
    /// Duration in minutes
    /// </summary>
    public int? Duration { get; set; }
    
    /// <summary>
    /// True if the baby is currently sleeping
    /// </summary>
    public bool IsActive { get; set; }
    
    public string? Comment { get; set; }
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual Baby Baby { get; set; } = null!;
}