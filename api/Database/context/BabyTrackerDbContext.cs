using BabyTracker.Database.entities;
using Microsoft.EntityFrameworkCore;

namespace BabyTracker.Database.context;

public class BabyTrackerDbContext : DbContext
{
    public BabyTrackerDbContext(DbContextOptions<BabyTrackerDbContext> options) : base(options)
    {
    }

    public DbSet<BabyEntry> BabyEntries { get; set; }
    
    public DbSet<SleepEntry> SleepEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BabyEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
                
            entity.Property(e => e.Date).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Time).IsRequired().HasMaxLength(5);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
                
            entity.Property(e => e.FeedType)
                .HasConversion<string>()
                .HasMaxLength(10);
                
            entity.Property(e => e.StartingBreast)
                .HasConversion<string>()
                .HasMaxLength(10);
            
            entity.HasIndex(e => new { e.UserId, e.Date });
            entity.HasIndex(e => e.UserId);
        });
        
        modelBuilder.Entity<SleepEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.StartTime).IsRequired();
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.Created).IsRequired();
            
            // Create indexes for better query performance
            entity.HasIndex(e => new { e.UserId, e.Date });
            entity.HasIndex(e => new { e.UserId, e.IsActive });
        });
    }
}