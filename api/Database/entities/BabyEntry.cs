using System.ComponentModel.DataAnnotations;

namespace BabyTracker.Database.entities;

/// <summary>
/// This is the class used for registering when the baby ate, peed, temp ...
/// </summary>
public class BabyEntry
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// User ID of the person who created this entry
    /// Foreign key to user (Azure Entra ID)
    /// </summary>
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Baby this entry belongs to
    /// </summary>
    public string? BabyId { get; set; } = string.Empty;
        
    [Required]
    public DateOnly Date { get; set; } // YYYY-MM-DD format
        
    [Required]
    public TimeOnly Time { get; set; } // HH:mm format
        
    [Required]
    public FeedTypes FeedType { get; set; }
        
    public StartingBreastTypes? StartingBreast { get; set; }
        
    public double? Temperature { get; set; }
        
    public bool DidPee { get; set; }
        
    public bool DidPoo { get; set; }
        
    public bool DidThrowUp { get; set; }
        
    [Required]
    public DateTimeOffset Created { get; set; } = DateTimeOffset.UtcNow;
        
    public DateTimeOffset? UpdatedAt { get; set; }
    
    public string? Comment { get; set; }
    
    // Navigation properties
    public virtual Baby Baby { get; set; } = null!;
}