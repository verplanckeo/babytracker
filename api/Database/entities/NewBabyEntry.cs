using System.ComponentModel.DataAnnotations;

namespace BabyTracker.Database.entities;

public class NewBabyEntry
{
        [Required]
        public DateOnly Date { get; set; }
        
        [Required]
        public TimeOnly Time { get; set; }
        
        [Required]
        public FeedTypes FeedType { get; set; }
        
        public StartingBreastTypes? StartingBreast { get; set; }
        
        public double? Temperature { get; set; }
        
        public bool DidPee { get; set; }
        
        public bool DidPoo { get; set; }

        public bool DidThrowUp { get; set; }

}