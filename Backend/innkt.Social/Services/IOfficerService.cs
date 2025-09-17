using innkt.Social.DTOs;

namespace innkt.Social.Services;

public interface IOfficerService
{
    Task<UserSearchResult?> SearchUsersAsync(string query, int page = 1, int limit = 20);
    Task<UserBasicInfo?> GetUserByIdAsync(Guid userId);
    Task<UserBasicInfo?> GetUserByUsernameAsync(string username);
    
    // Batch operations for feed optimization
    Task<Dictionary<Guid, UserBasicInfo>> GetUsersByIdsAsync(IEnumerable<Guid> userIds);
    Task<List<UserBasicInfo>> GetUsersAsync(IEnumerable<Guid> userIds);
}

public class UserSearchResult
{
    public List<UserBasicInfo> Users { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public bool HasMore { get; set; }
}
