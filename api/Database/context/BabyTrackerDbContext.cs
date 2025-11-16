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
    
    // New family system DbSets
    public DbSet<Family> Families { get; set; }
    public DbSet<FamilyMember> FamilyMembers { get; set; }
    public DbSet<Baby> Babies { get; set; }
    
    public DbSet<FamilyInvitation> FamilyInvitations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Family entity
        modelBuilder.Entity<Family>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.OwnerId).IsRequired();
            entity.HasIndex(e => e.OwnerId);
        });

        // Configure FamilyMember entity
        modelBuilder.Entity<FamilyMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.FamilyId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.FamilyId, e.UserId }).IsUnique();
            
            entity.HasOne(e => e.Family)
                .WithMany(f => f.Members)
                .HasForeignKey(e => e.FamilyId);
        });

        // Configure Baby entity
        modelBuilder.Entity<Baby>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.FamilyId);
            
            entity.HasOne(e => e.Family)
                .WithMany(f => f.Babies)
                .HasForeignKey(e => e.FamilyId);
        });

        // Configure FamilyInvitation entity
        modelBuilder.Entity<FamilyInvitation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.InvitationToken).IsRequired();
            entity.HasIndex(e => e.FamilyId);
            entity.HasIndex(e => e.InvitationToken).IsUnique();
            
            entity.HasOne(e => e.Family)
                .WithMany()
                .HasForeignKey(e => e.FamilyId);
        });
        
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
            entity.HasIndex(e => new { e.UserId, e.BabyId, e.Date });
            
            entity.HasOne(e => e.Baby)
                .WithMany(b => b.BabyEntries)
                .HasForeignKey(e => e.BabyId);
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
            entity.HasIndex(e => new { e.UserId, e.Date, e.IsActive });
            
            entity.HasOne(e => e.Baby)
                .WithMany(b => b.SleepEntries)
                .HasForeignKey(e => e.BabyId);
        });
    }
}