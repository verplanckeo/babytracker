using System.Security.Claims;

namespace BabyTracker.Infra;

/// <summary>
/// Get authenticated user context.
/// </summary>
public interface IUserContext
{
    /// <summary>
    /// Get user claims principal object.
    /// </summary>
    /// <returns></returns>
    ClaimsPrincipal GetUserIdentity();

    /// <summary>
    /// Return user's unique identifier.
    /// </summary>
    /// <returns></returns>
    string GetUserId();
}

/// <summary>
/// User context implementation.
/// </summary>
public class UserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    
    public UserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    /// <summary>
    /// CTor
    /// </summary>
    /// <returns></returns>
    /// <exception cref="UnauthorizedAccessException"></exception>
    public ClaimsPrincipal GetUserIdentity()
    {
        return _httpContextAccessor.HttpContext?.User ?? 
               throw new UnauthorizedAccessException("No HTTP context available!");
    }

    public string GetUserId()
    {
        var user = GetUserIdentity();
        return user.FindFirstValue(ClaimTypes.NameIdentifier) ?? 
               user.FindFirst("oid")?.Value ??
               throw new UnauthorizedAccessException("User ID not found in claims!");
    }
}