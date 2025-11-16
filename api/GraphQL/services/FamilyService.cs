// api/GraphQL/services/IFamilyService.cs

using BabyTracker.Database.context;
using BabyTracker.Database.entities;
using BabyTracker.Database.entities.enums;
using BabyTracker.GraphQL.types;
using Microsoft.EntityFrameworkCore;

namespace BabyTracker.GraphQL.services;

public interface IFamilyService
{
    // Family management
    Task<Family> CreateFamilyAsync(string userId, CreateFamilyInputType input);
    Task<Family> UpdateFamilyAsync(string userId, string familyId, UpdateFamilyInputType input);
    Task<List<Family>> GetUserFamiliesAsync(string userId);
    Task<Family?> GetFamilyByIdAsync(string userId, string familyId);
    Task<bool> DeleteFamilyAsync(string userId, string familyId);
    
    // Baby management
    Task<Baby> CreateBabyAsync(string userId, string familyId, CreateBabyInputType input);
    Task<Baby> UpdateBabyAsync(string userId, string babyId, UpdateBabyInputType input);
    Task<List<Baby>> GetFamilyBabiesAsync(string userId, string familyId);
    Task<Baby?> GetBabyByIdAsync(string userId, string babyId);
    Task<bool> DeleteBabyAsync(string userId, string babyId);
    
    // Family member management
    Task<FamilyInvitation> InviteMemberAsync(string userId, string familyId, InviteMemberInputType input);
    Task<FamilyMember> AcceptInvitationAsync(string userId, string invitationToken);
    Task<bool> DeclineInvitationAsync(string userId, string invitationToken);
    Task<List<FamilyMember>> GetFamilyMembersAsync(string userId, string familyId);
    Task<bool> RemoveMemberAsync(string userId, string familyId, string memberId);
    Task<FamilyMember> UpdateMemberRoleAsync(string userId, string familyId, string memberId, FamilyMemberRole role);
    
    // Invitation management
    Task<List<FamilyInvitation>> GetPendingInvitationsAsync(string userId);
    Task<FamilyInvitation?> GetInvitationByTokenAsync(string token);
    Task<bool> CancelInvitationAsync(string userId, string invitationId);
    
    // Authorization helpers
    Task<bool> IsUserFamilyMemberAsync(string userId, string familyId);
    Task<bool> IsUserFamilyOwnerAsync(string userId, string familyId);
    Task<bool> CanUserAccessBabyAsync(string userId, string babyId);
    Task<string?> GetBabyFamilyIdAsync(string babyId);
}

public class FamilyService : IFamilyService
{
    private readonly BabyTrackerDbContext _context;
    private readonly ILogger<FamilyService> _logger;

    public FamilyService(BabyTrackerDbContext context, ILogger<FamilyService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Family management
    public async Task<Family> CreateFamilyAsync(string userId, CreateFamilyInputType input)
    {
        var family = new Family
        {
            Id = Guid.NewGuid().ToString(),
            Name = input.Name,
            OwnerId = userId,
            Created = DateTime.UtcNow
        };

        _context.Families.Add(family);

        // Create family member entry for the owner
        var ownerMember = new FamilyMember
        {
            Id = Guid.NewGuid().ToString(),
            FamilyId = family.Id,
            UserId = userId,
            DisplayName = input.OwnerDisplayName ?? "You",
            Role = FamilyMemberRole.Owner,
            Status = MembershipStatus.Active,
            Created = DateTime.UtcNow
        };

        _context.FamilyMembers.Add(ownerMember);
        await _context.SaveChangesAsync();

        return family;
    }

    public async Task<Family> UpdateFamilyAsync(string userId, string familyId, UpdateFamilyInputType input)
    {
        var family = await _context.Families
            .FirstOrDefaultAsync(f => f.Id == familyId && f.OwnerId == userId);

        if (family == null)
            throw new UnauthorizedAccessException("Only family owners can update family information");

        if (!string.IsNullOrWhiteSpace(input.Name))
            family.Name = input.Name;

        family.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return family;
    }

    public async Task<List<Family>> GetUserFamiliesAsync(string userId)
    {
        return await _context.FamilyMembers
            .Where(fm => fm.UserId == userId && fm.Status == MembershipStatus.Active)
            .Include(fm => fm.Family)
            .Select(fm => fm.Family)
            .ToListAsync();
    }

    public async Task<Family?> GetFamilyByIdAsync(string userId, string familyId)
    {
        var isAuthorized = await IsUserFamilyMemberAsync(userId, familyId);
        if (!isAuthorized)
            return null;

        return await _context.Families
            .Include(f => f.Members.Where(m => m.Status == MembershipStatus.Active))
            .Include(f => f.Babies)
            .FirstOrDefaultAsync(f => f.Id == familyId);
    }

    public async Task<bool> DeleteFamilyAsync(string userId, string familyId)
    {
        var family = await _context.Families
            .FirstOrDefaultAsync(f => f.Id == familyId && f.OwnerId == userId);

        if (family == null)
            return false;

        // This will cascade delete all related entities
        _context.Families.Remove(family);
        await _context.SaveChangesAsync();

        return true;
    }

    // Baby management
    public async Task<Baby> CreateBabyAsync(string userId, string familyId, CreateBabyInputType input)
    {
        var isAuthorized = await IsUserFamilyMemberAsync(userId, familyId);
        if (!isAuthorized)
            throw new UnauthorizedAccessException("User is not a member of this family");

        var baby = new Baby
        {
            Id = Guid.NewGuid().ToString(),
            FamilyId = familyId,
            Name = input.Name,
            BirthDate = input.BirthDate,
            Gender = input.Gender,
            Notes = input.Notes,
            CreatedBy = userId,
            Created = DateTime.UtcNow
        };

        _context.Babies.Add(baby);
        await _context.SaveChangesAsync();

        return baby;
    }

    public async Task<Baby> UpdateBabyAsync(string userId, string babyId, UpdateBabyInputType input)
    {
        var baby = await _context.Babies
            .Include(b => b.Family)
            .ThenInclude(f => f.Members)
            .FirstOrDefaultAsync(b => b.Id == babyId);

        if (baby == null)
            throw new ArgumentException("Baby not found");

        var isAuthorized = await IsUserFamilyMemberAsync(userId, baby.FamilyId);
        if (!isAuthorized)
            throw new UnauthorizedAccessException("User is not authorized to update this baby");

        if (!string.IsNullOrWhiteSpace(input.Name))
            baby.Name = input.Name;
        if (input.BirthDate.HasValue)
            baby.BirthDate = input.BirthDate;
        if (input.Gender.HasValue)
            baby.Gender = input.Gender.Value;
        if (input.Notes != null)
            baby.Notes = input.Notes;

        baby.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return baby;
    }

    public async Task<List<Baby>> GetFamilyBabiesAsync(string userId, string familyId)
    {
        var isAuthorized = await IsUserFamilyMemberAsync(userId, familyId);
        if (!isAuthorized)
            throw new UnauthorizedAccessException("User is not a member of this family");

        return await _context.Babies
            .Where(b => b.FamilyId == familyId)
            .OrderBy(b => b.Name)
            .ToListAsync();
    }

    public async Task<Baby?> GetBabyByIdAsync(string userId, string babyId)
    {
        var baby = await _context.Babies
            .FirstOrDefaultAsync(b => b.Id == babyId);

        if (baby == null)
            return null;

        var isAuthorized = await IsUserFamilyMemberAsync(userId, baby.FamilyId);
        if (!isAuthorized)
            return null;

        return baby;
    }

    public async Task<bool> DeleteBabyAsync(string userId, string babyId)
    {
        var baby = await _context.Babies
            .FirstOrDefaultAsync(b => b.Id == babyId);

        if (baby == null)
            return false;

        var isOwner = await IsUserFamilyOwnerAsync(userId, baby.FamilyId);
        if (!isOwner)
            throw new UnauthorizedAccessException("Only family owners can delete babies");

        _context.Babies.Remove(baby);
        await _context.SaveChangesAsync();

        return true;
    }

    // Family member management
    public async Task<FamilyInvitation> InviteMemberAsync(string userId, string familyId, InviteMemberInputType input)
    {
        var isOwnerOrParent = await _context.FamilyMembers
            .AnyAsync(fm => fm.FamilyId == familyId && 
                           fm.UserId == userId && 
                           fm.Status == MembershipStatus.Active &&
                           (fm.Role == FamilyMemberRole.Owner || fm.Role == FamilyMemberRole.Parent));

        if (!isOwnerOrParent)
            throw new UnauthorizedAccessException("Only owners and parents can invite members");

        // Check if user is already a member
        var existingMember = await _context.FamilyMembers
            .AnyAsync(fm => fm.FamilyId == familyId && fm.Email == input.Email);

        if (existingMember)
            throw new InvalidOperationException("User is already a member of this family");

        // Check if there's already a pending invitation
        var existingInvitation = await _context.FamilyInvitations
            .FirstOrDefaultAsync(inv => inv.FamilyId == familyId && 
                                       inv.Email == input.Email && 
                                       inv.Status == InvitationStatus.Pending);

        if (existingInvitation != null)
        {
            // Update existing invitation
            existingInvitation.Role = input.Role;
            existingInvitation.Message = input.Message;
            existingInvitation.InvitedBy = userId;
            existingInvitation.ExpiresAt = DateTime.UtcNow.AddDays(7);
            existingInvitation.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return existingInvitation;
        }

        var invitation = new FamilyInvitation
        {
            Id = Guid.NewGuid().ToString(),
            FamilyId = familyId,
            Email = input.Email,
            InvitedBy = userId,
            Role = input.Role,
            Message = input.Message,
            InvitationToken = Guid.NewGuid().ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow
        };

        _context.FamilyInvitations.Add(invitation);
        await _context.SaveChangesAsync();

        return invitation;
    }

    public async Task<FamilyMember> AcceptInvitationAsync(string userId, string invitationToken)
    {
        var invitation = await _context.FamilyInvitations
            .Include(inv => inv.Family)
            .FirstOrDefaultAsync(inv => inv.InvitationToken == invitationToken && 
                                       inv.Status == InvitationStatus.Pending &&
                                       inv.ExpiresAt > DateTime.UtcNow);

        if (invitation == null)
            throw new ArgumentException("Invalid or expired invitation");

        // Create family member
        var member = new FamilyMember
        {
            Id = Guid.NewGuid().ToString(),
            FamilyId = invitation.FamilyId,
            UserId = userId,
            DisplayName = "New Member", // User can update this later
            Email = invitation.Email,
            Role = invitation.Role,
            Status = MembershipStatus.Active,
            InvitedBy = invitation.InvitedBy,
            Created = DateTime.UtcNow
        };

        _context.FamilyMembers.Add(member);

        // Update invitation status
        invitation.Status = InvitationStatus.Accepted;
        invitation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return member;
    }

    public async Task<bool> DeclineInvitationAsync(string userId, string invitationToken)
    {
        var invitation = await _context.FamilyInvitations
            .FirstOrDefaultAsync(inv => inv.InvitationToken == invitationToken && 
                                       inv.Status == InvitationStatus.Pending);

        if (invitation == null)
            return false;

        invitation.Status = InvitationStatus.Declined;
        invitation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<FamilyMember>> GetFamilyMembersAsync(string userId, string familyId)
    {
        var isAuthorized = await IsUserFamilyMemberAsync(userId, familyId);
        if (!isAuthorized)
            throw new UnauthorizedAccessException("User is not a member of this family");

        return await _context.FamilyMembers
            .Where(fm => fm.FamilyId == familyId && fm.Status == MembershipStatus.Active)
            .OrderBy(fm => fm.Role)
            .ThenBy(fm => fm.DisplayName)
            .ToListAsync();
    }

    public async Task<bool> RemoveMemberAsync(string userId, string familyId, string memberId)
    {
        var isOwner = await IsUserFamilyOwnerAsync(userId, familyId);
        if (!isOwner)
            throw new UnauthorizedAccessException("Only family owners can remove members");

        var member = await _context.FamilyMembers
            .FirstOrDefaultAsync(fm => fm.Id == memberId && fm.FamilyId == familyId);

        if (member == null || member.Role == FamilyMemberRole.Owner)
            return false;

        member.Status = MembershipStatus.Inactive;
        member.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FamilyMember> UpdateMemberRoleAsync(string userId, string familyId, string memberId, FamilyMemberRole role)
    {
        var isOwner = await IsUserFamilyOwnerAsync(userId, familyId);
        if (!isOwner)
            throw new UnauthorizedAccessException("Only family owners can update member roles");

        var member = await _context.FamilyMembers
            .FirstOrDefaultAsync(fm => fm.Id == memberId && fm.FamilyId == familyId);

        if (member == null || member.Role == FamilyMemberRole.Owner)
            throw new ArgumentException("Cannot update owner role");

        member.Role = role;
        member.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return member;
    }

    // Invitation management
    public async Task<List<FamilyInvitation>> GetPendingInvitationsAsync(string userId)
    {
        // This would typically require email lookup, but for now we'll use a placeholder
        // In a real implementation, you'd need to match the user's email with invitation emails
        return await _context.FamilyInvitations
            .Include(inv => inv.Family)
            .Where(inv => inv.Status == InvitationStatus.Pending && 
                         inv.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
    }

    public async Task<FamilyInvitation?> GetInvitationByTokenAsync(string token)
    {
        return await _context.FamilyInvitations
            .Include(inv => inv.Family)
            .FirstOrDefaultAsync(inv => inv.InvitationToken == token);
    }

    public async Task<bool> CancelInvitationAsync(string userId, string invitationId)
    {
        var invitation = await _context.FamilyInvitations
            .FirstOrDefaultAsync(inv => inv.Id == invitationId && inv.InvitedBy == userId);

        if (invitation == null)
            return false;

        invitation.Status = InvitationStatus.Expired;
        invitation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // Authorization helpers
    public async Task<bool> IsUserFamilyMemberAsync(string userId, string familyId)
    {
        return await _context.FamilyMembers
            .AnyAsync(fm => fm.UserId == userId && 
                           fm.FamilyId == familyId && 
                           fm.Status == MembershipStatus.Active);
    }

    public async Task<bool> IsUserFamilyOwnerAsync(string userId, string familyId)
    {
        return await _context.Families
            .AnyAsync(f => f.Id == familyId && f.OwnerId == userId);
    }

    public async Task<bool> CanUserAccessBabyAsync(string userId, string babyId)
    {
        var baby = await _context.Babies
            .FirstOrDefaultAsync(b => b.Id == babyId);

        if (baby == null)
            return false;

        return await IsUserFamilyMemberAsync(userId, baby.FamilyId);
    }

    public async Task<string?> GetBabyFamilyIdAsync(string babyId)
    {
        var baby = await _context.Babies
            .FirstOrDefaultAsync(b => b.Id == babyId);

        return baby?.FamilyId;
    }
}