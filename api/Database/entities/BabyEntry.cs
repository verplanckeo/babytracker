using System.ComponentModel.DataAnnotations;

namespace BabyTracker.Database.entities;

public class BabyEntry
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
        
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
        
    // Foreign key to user (Azure Entra ID)
    [Required]
    public string UserId { get; set; }
}