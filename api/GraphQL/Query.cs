// api/GraphQL/Query.cs - Complete Query class with all methods
using BabyTracker.Database.entities;
using BabyTracker.GraphQL.types;
using BabyTracker.GraphQL.services;
using BabyTracker.Infra;
using Microsoft.AspNetCore.Authorization;

namespace BabyTracker.GraphQL;

[Authorize]
public class Query
{
    private readonly IBabyEntryService _babyEntryService;
    private readonly ISleepEntryService _sleepService;
    private readonly IFamilyService _familyService;
    private readonly IUserContext _userContext;

    public Query(
        IBabyEntryService babyEntryService, 
        ISleepEntryService sleepService, 
        IFamilyService familyService,
        IUserContext userContext)
    {
        _babyEntryService = babyEntryService;
        _sleepService = sleepService;
        _familyService = familyService;
        _userContext = userContext;
    }

    #region Family Queries

    /// <summary>
    /// Get all families the current user belongs to
    /// </summary>
    public async Task<List<FamilyType>> UserFamilies()
    {
        var userId = _userContext.GetUserId();
        var families = await _familyService.GetUserFamiliesAsync(userId);
        return families.Select(MapFamilyToGraphQLType).ToList();
    }

    /// <summary>
    /// Get a specific family by ID
    /// </summary>
    public async Task<FamilyType?> Family(string familyId)
    {
        var userId = _userContext.GetUserId();
        var family = await _familyService.GetFamilyByIdAsync(userId, familyId);
        return family != null ? MapFamilyToGraphQLType(family) : null;
    }

    /// <summary>
    /// Get all babies in a family
    /// </summary>
    public async Task<List<BabyType>> FamilyBabies(string familyId)
    {
        var userId = _userContext.GetUserId();
        var babies = await _familyService.GetFamilyBabiesAsync(userId, familyId);
        return babies.Select(MapBabyToGraphQLType).ToList();
    }

    /// <summary>
    /// Get a specific baby by ID
    /// </summary>
    public async Task<BabyType?> Baby(string babyId)
    {
        var userId = _userContext.GetUserId();
        var baby = await _familyService.GetBabyByIdAsync(userId, babyId);
        return baby != null ? MapBabyToGraphQLType(baby) : null;
    }

    /// <summary>
    /// Get all members of a family
    /// </summary>
    public async Task<List<FamilyMemberType>> FamilyMembers(string familyId)
    {
        var userId = _userContext.GetUserId();
        var members = await _familyService.GetFamilyMembersAsync(userId, familyId);
        return members.Select(MapFamilyMemberToGraphQLType).ToList();
    }

    /// <summary>
    /// Get all pending invitations for the current user
    /// </summary>
    public async Task<List<FamilyInvitationType>> PendingInvitations()
    {
        var userId = _userContext.GetUserId();
        var invitations = await _familyService.GetPendingInvitationsAsync(userId);
        return invitations.Select(MapFamilyInvitationToGraphQLType).ToList();
    }

    /// <summary>
    /// Get invitation details by token (for invitation acceptance page)
    /// </summary>
    public async Task<FamilyInvitationType?> InvitationByToken(string token)
    {
        var invitation = await _familyService.GetInvitationByTokenAsync(token);
        return invitation != null ? MapFamilyInvitationToGraphQLType(invitation) : null;
    }

    #endregion

    #region Baby Entry Queries (Updated for Family System)

    /// <summary>
    /// Get all feeding entries for a specific baby
    /// </summary>
    public async Task<List<BabyEntryType>> BabyEntries(string babyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _babyEntryService.GetBabyEntriesAsync(userId, babyId);
        return MapBabyEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get feeding entries for a specific baby on a specific date
    /// </summary>
    public async Task<List<BabyEntryType>> BabyEntriesByDate(string babyId, string date)
    {
        var userId = _userContext.GetUserId();
        var entries = await _babyEntryService.GetBabyEntriesByDateAsync(userId, babyId, date);
        return MapBabyEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get feeding entries for a specific baby within a date range
    /// </summary>
    public async Task<List<BabyEntryType>> BabyEntriesByDateRange(string babyId, string startDate, string endDate)
    {
        var userId = _userContext.GetUserId();
        var entries = await _babyEntryService.GetBabyEntriesByDateRangeAsync(userId, babyId, startDate, endDate);
        return MapBabyEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get all feeding entries for all babies in a family
    /// </summary>
    public async Task<List<BabyEntryType>> FamilyBabyEntries(string familyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _babyEntryService.GetFamilyEntriesAsync(userId, familyId);
        return MapBabyEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get all feeding entries across all families the user belongs to
    /// </summary>
    public async Task<List<BabyEntryType>> AllUserBabyEntries()
    {
        var userId = _userContext.GetUserId();
        var entries = await _babyEntryService.GetAllUserEntriesAsync(userId);
        return MapBabyEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get a specific feeding entry by ID
    /// </summary>
    public async Task<BabyEntryType?> BabyEntry(string id)
    {
        var userId = _userContext.GetUserId();
        var entry = await _babyEntryService.GetEntryByIdAsync(userId, id);
        return entry != null ? MapBabyEntryToGraphQLType(entry) : null;
    }

    // Legacy methods for backward compatibility (these will use the user's first family's first baby)
    /// <summary>
    /// Legacy method: Get all entries for the user's primary baby
    /// </summary>
    [Obsolete("Use BabyEntries(babyId) instead. This method uses the user's first baby for backward compatibility.")]
    public async Task<List<BabyEntryType>> BabyEntriesLegacy()
    {
        var userId = _userContext.GetUserId();
        var primaryBabyId = await GetUserPrimaryBabyIdAsync(userId);
        if (primaryBabyId == null)
            return new List<BabyEntryType>();
            
        var entries = await _babyEntryService.GetBabyEntriesAsync(userId, primaryBabyId);
        return MapBabyEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Legacy method: Get entries by date for the user's primary baby
    /// </summary>
    [Obsolete("Use BabyEntriesByDate(babyId, date) instead. This method uses the user's first baby for backward compatibility.")]
    public async Task<List<BabyEntryType>> BabyEntriesByDateLegacy(string date)
    {
        var userId = _userContext.GetUserId();
        var primaryBabyId = await GetUserPrimaryBabyIdAsync(userId);
        if (primaryBabyId == null)
            return new List<BabyEntryType>();
            
        var entries = await _babyEntryService.GetBabyEntriesByDateAsync(userId, primaryBabyId, date);
        return MapBabyEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Legacy method: Get entries by date range for the user's primary baby
    /// </summary>
    [Obsolete("Use BabyEntriesByDateRange(babyId, startDate, endDate) instead. This method uses the user's first baby for backward compatibility.")]
    public async Task<List<BabyEntryType>> BabyEntriesByDateRangeLegacy(string startDate, string endDate)
    {
        var userId = _userContext.GetUserId();
        var primaryBabyId = await GetUserPrimaryBabyIdAsync(userId);
        if (primaryBabyId == null)
            return new List<BabyEntryType>();
            
        var entries = await _babyEntryService.GetBabyEntriesByDateRangeAsync(userId, primaryBabyId, startDate, endDate);
        return MapBabyEntriesToGraphQLType(entries);
    }

    #endregion

    #region Sleep Entry Queries (Updated for Family System)

    /// <summary>
    /// Get all sleep entries for a specific baby
    /// </summary>
    public async Task<List<SleepEntryType>> BabySleepEntries(string babyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _sleepService.GetBabySleepEntriesAsync(userId, babyId);
        return MapSleepEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get sleep entries for a specific baby on a specific date
    /// </summary>
    public async Task<List<SleepEntryType>> BabySleepEntriesByDate(string babyId, string date)
    {
        var userId = _userContext.GetUserId();
        var entries = await _sleepService.GetBabySleepEntriesByDateAsync(userId, babyId, date);
        return MapSleepEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get sleep entries for a specific baby within a date range
    /// </summary>
    public async Task<List<SleepEntryType>> BabySleepEntriesByDateRange(string babyId, string startDate, string endDate)
    {
        var userId = _userContext.GetUserId();
        var entries = await _sleepService.GetBabySleepEntriesByDateRangeAsync(userId, babyId, startDate, endDate);
        return MapSleepEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get all sleep entries for all babies in a family
    /// </summary>
    public async Task<List<SleepEntryType>> FamilySleepEntries(string familyId)
    {
        var userId = _userContext.GetUserId();
        var entries = await _sleepService.GetFamilySleepEntriesAsync(userId, familyId);
        return MapSleepEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get all sleep entries across all families the user belongs to
    /// </summary>
    public async Task<List<SleepEntryType>> AllUserSleepEntries()
    {
        var userId = _userContext.GetUserId();
        var entries = await _sleepService.GetAllUserSleepEntriesAsync(userId);
        return MapSleepEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Get the currently active sleep session for a specific baby
    /// </summary>
    public async Task<SleepEntryType?> BabyActiveSleep(string babyId)
    {
        var userId = _userContext.GetUserId();
        var activeSleep = await _sleepService.GetBabyActiveSleepAsync(userId, babyId);
        return activeSleep != null ? MapSleepEntryToGraphQLType(activeSleep) : null;
    }

    /// <summary>
    /// Get a specific sleep entry by ID
    /// </summary>
    public async Task<SleepEntryType?> SleepEntry(string id)
    {
        var userId = _userContext.GetUserId();
        var entry = await _sleepService.GetSleepEntryByIdAsync(userId, id);
        return entry != null ? MapSleepEntryToGraphQLType(entry) : null;
    }

    // Legacy methods for backward compatibility (these will use the user's first family's first baby)
    /// <summary>
    /// Legacy method: Get all sleep entries for the user's primary baby
    /// </summary>
    [Obsolete("Use BabySleepEntries(babyId) instead. This method uses the user's first baby for backward compatibility.")]
    public async Task<List<SleepEntryType>> SleepEntriesLegacy()
    {
        var userId = _userContext.GetUserId();
        var primaryBabyId = await GetUserPrimaryBabyIdAsync(userId);
        if (primaryBabyId == null)
            return new List<SleepEntryType>();
            
        var entries = await _sleepService.GetBabySleepEntriesAsync(userId, primaryBabyId);
        return MapSleepEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Legacy method: Get sleep entries by date for the user's primary baby
    /// </summary>
    [Obsolete("Use BabySleepEntriesByDate(babyId, date) instead. This method uses the user's first baby for backward compatibility.")]
    public async Task<List<SleepEntryType>> SleepEntriesByDateLegacy(string date)
    {
        var userId = _userContext.GetUserId();
        var primaryBabyId = await GetUserPrimaryBabyIdAsync(userId);
        if (primaryBabyId == null)
            return new List<SleepEntryType>();
            
        var entries = await _sleepService.GetBabySleepEntriesByDateAsync(userId, primaryBabyId, date);
        return MapSleepEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Legacy method: Get sleep entries by date range for the user's primary baby
    /// </summary>
    [Obsolete("Use BabySleepEntriesByDateRange(babyId, startDate, endDate) instead. This method uses the user's first baby for backward compatibility.")]
    public async Task<List<SleepEntryType>> SleepEntriesByDateRangeLegacy(string startDate, string endDate)
    {
        var userId = _userContext.GetUserId();
        var primaryBabyId = await GetUserPrimaryBabyIdAsync(userId);
        if (primaryBabyId == null)
            return new List<SleepEntryType>();
            
        var entries = await _sleepService.GetBabySleepEntriesByDateRangeAsync(userId, primaryBabyId, startDate, endDate);
        return MapSleepEntriesToGraphQLType(entries);
    }

    /// <summary>
    /// Legacy method: Get active sleep for the user's primary baby
    /// </summary>
    [Obsolete("Use BabyActiveSleep(babyId) instead. This method uses the user's first baby for backward compatibility.")]
    public async Task<SleepEntryType?> ActiveSleepLegacy()
    {
        var userId = _userContext.GetUserId();
        var primaryBabyId = await GetUserPrimaryBabyIdAsync(userId);
        if (primaryBabyId == null)
            return null;
            
        var activeSleep = await _sleepService.GetBabyActiveSleepAsync(userId, primaryBabyId);
        return activeSleep != null ? MapSleepEntryToGraphQLType(activeSleep) : null;
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Get the user's primary baby ID (first baby in first family) for legacy compatibility
    /// </summary>
    private async Task<string?> GetUserPrimaryBabyIdAsync(string userId)
    {
        var families = await _familyService.GetUserFamiliesAsync(userId);
        var firstFamily = families.FirstOrDefault();
        if (firstFamily == null)
            return null;
            
        var babies = await _familyService.GetFamilyBabiesAsync(userId, firstFamily.Id);
        return babies.FirstOrDefault()?.Id;
    }

    #endregion

    #region Mapping Methods

    private static FamilyType MapFamilyToGraphQLType(Family family)
    {
        return new FamilyType
        {
            Id = family.Id,
            Name = family.Name,
            OwnerId = family.OwnerId,
            Created = family.Created,
            UpdatedAt = family.UpdatedAt,
            Members = family.Members?.Select(MapFamilyMemberToGraphQLType).ToList() ?? new(),
            Babies = family.Babies?.Select(MapBabyToGraphQLType).ToList() ?? new()
        };
    }

    private static FamilyMemberType MapFamilyMemberToGraphQLType(FamilyMember member)
    {
        return new FamilyMemberType
        {
            Id = member.Id,
            FamilyId = member.FamilyId,
            UserId = member.UserId,
            DisplayName = member.DisplayName,
            Email = member.Email,
            Role = member.Role,
            Status = member.Status,
            InvitedBy = member.InvitedBy,
            Created = member.Created,
            UpdatedAt = member.UpdatedAt
        };
    }

    private static BabyType MapBabyToGraphQLType(Baby baby)
    {
        return new BabyType
        {
            Id = baby.Id,
            FamilyId = baby.FamilyId,
            Name = baby.Name,
            BirthDate = baby.BirthDate,
            Gender = baby.Gender,
            Notes = baby.Notes,
            CreatedBy = baby.CreatedBy,
            Created = baby.Created,
            UpdatedAt = baby.UpdatedAt,
            Family = baby.Family != null ? MapFamilyToGraphQLType(baby.Family) : null!
        };
    }

    private static FamilyInvitationType MapFamilyInvitationToGraphQLType(FamilyInvitation invitation)
    {
        return new FamilyInvitationType
        {
            Id = invitation.Id,
            FamilyId = invitation.FamilyId,
            Email = invitation.Email,
            InvitedBy = invitation.InvitedBy,
            Role = invitation.Role,
            Status = invitation.Status,
            Message = invitation.Message,
            InvitationToken = invitation.InvitationToken,
            ExpiresAt = invitation.ExpiresAt,
            Created = invitation.Created,
            UpdatedAt = invitation.UpdatedAt,
            Family = MapFamilyToGraphQLType(invitation.Family)
        };
    }

    private List<BabyEntryType> MapBabyEntriesToGraphQLType(List<BabyEntry> entries)
    {
        var result = new List<BabyEntryType>();
        
        foreach (var entry in entries)
        {
            result.Add(MapBabyEntryToGraphQLType(entry));
        }
        
        return result;
    }

    private BabyEntryType MapBabyEntryToGraphQLType(BabyEntry entry)
    {
        // Get the display name of the person who created this entry
        var createdByDisplayName = "Unknown";
        if (entry.Baby?.Family?.Members != null)
        {
            var creator = entry.Baby.Family.Members.FirstOrDefault(m => m.UserId == entry.UserId);
            createdByDisplayName = creator?.DisplayName ?? "Unknown";
        }

        return new BabyEntryType
        {
            Id = entry.Id,
            BabyId = entry.BabyId,
            UserId = entry.UserId,
            Date = entry.Date,
            Time = entry.Time,
            FeedType = entry.FeedType,
            StartingBreast = entry.StartingBreast,
            Temperature = entry.Temperature,
            DidPee = entry.DidPee,
            DidPoo = entry.DidPoo,
            DidThrowUp = entry.DidThrowUp,
            Comment = entry.Comment,
            Created = entry.Created,
            UpdatedAt = entry.UpdatedAt,
            Baby = entry.Baby != null ? MapBabyToGraphQLType(entry.Baby) : null!,
            CreatedByDisplayName = createdByDisplayName
        };
    }

    private List<SleepEntryType> MapSleepEntriesToGraphQLType(List<SleepEntry> entries)
    {
        var result = new List<SleepEntryType>();
        
        foreach (var entry in entries)
        {
            result.Add(MapSleepEntryToGraphQLType(entry));
        }
        
        return result;
    }

    private SleepEntryType MapSleepEntryToGraphQLType(SleepEntry entry)
    {
        // Get the display name of the person who created this entry
        var createdByDisplayName = "Unknown";
        if (entry.Baby?.Family?.Members != null)
        {
            var creator = entry.Baby.Family.Members.FirstOrDefault(m => m.UserId == entry.UserId);
            createdByDisplayName = creator?.DisplayName ?? "Unknown";
        }

        return new SleepEntryType
        {
            Id = entry.Id,
            BabyId = entry.BabyId,
            UserId = entry.UserId,
            Date = entry.Date,
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            Duration = entry.Duration,
            IsActive = entry.IsActive,
            Comment = entry.Comment,
            Created = entry.Created,
            UpdatedAt = entry.UpdatedAt,
            Baby = entry.Baby != null ? MapBabyToGraphQLType(entry.Baby) : null!,
            CreatedByDisplayName = createdByDisplayName
        };
    }

    #endregion
}