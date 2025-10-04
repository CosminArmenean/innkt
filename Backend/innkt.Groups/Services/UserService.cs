using innkt.Groups.DTOs;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace innkt.Groups.Services;

public class UserService : IUserService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<UserService> _logger;

    public UserService(HttpClient httpClient, ILogger<UserService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<UserBasicInfo?> GetUserBasicInfoAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("Getting user profile for GUID: {UserId}", userId);
            
            // Call the Social service to get user by GUID
            var response = await _httpClient.GetAsync($"http://localhost:8081/api/users/guid/{userId}");
            
            if (response.IsSuccessStatusCode)
            {
                var jsonContent = await response.Content.ReadAsStringAsync();
                var userProfile = JsonSerializer.Deserialize<UserProfileResponse>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (userProfile != null)
                {
                    _logger.LogInformation("Successfully retrieved user profile for {UserId}: {Username}", userId, userProfile.Username);
                    
                    return new UserBasicInfo
                    {
                        Id = userId,
                        Username = userProfile.Username,
                        DisplayName = userProfile.DisplayName,
                        AvatarUrl = userProfile.Avatar,
                        IsVerified = userProfile.IsVerified
                    };
                }
            }
            else
            {
                _logger.LogWarning("Failed to get user profile for {UserId}, status: {StatusCode}", userId, response.StatusCode);
            }

            // Fallback to mock data if Social service is not available
            _logger.LogInformation("Using fallback user data for {UserId}", userId);
            return new UserBasicInfo
            {
                Id = userId,
                Username = $"user{userId.ToString()[..8]}",
                DisplayName = $"User {userId.ToString()[..8]}",
                AvatarUrl = null,
                IsVerified = false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user info for {UserId}", userId);
            
            // Fallback to mock data
            return new UserBasicInfo
            {
                Id = userId,
                Username = $"user{userId.ToString()[..8]}",
                DisplayName = $"User {userId.ToString()[..8]}",
                AvatarUrl = null,
                IsVerified = false
            };
        }
    }

    public async Task<List<UserBasicInfo>> GetUsersBasicInfoAsync(List<Guid> userIds)
    {
        try
        {
            if (!userIds.Any())
            {
                return new List<UserBasicInfo>();
            }

            _logger.LogInformation("Getting user profiles for {Count} GUIDs in batch", userIds.Count);
            
            // Use batch endpoint for better performance
            var jsonContent = System.Text.Json.JsonSerializer.Serialize(userIds);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync("http://localhost:8081/api/users/guid/batch", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var userProfiles = System.Text.Json.JsonSerializer.Deserialize<List<UserProfileResponse>>(responseContent, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (userProfiles != null)
                {
                    var users = userProfiles.Select(profile => new UserBasicInfo
                    {
                        Id = Guid.Parse(profile.Id),
                        Username = profile.Username,
                        DisplayName = profile.DisplayName,
                        AvatarUrl = profile.Avatar,
                        IsVerified = profile.IsVerified
                    }).ToList();

                    _logger.LogInformation("Successfully retrieved {Count} user profiles in batch", users.Count);
                    return users;
                }
            }
            else
            {
                _logger.LogWarning("Failed to get user profiles in batch, status: {StatusCode}", response.StatusCode);
            }

            // Fallback to individual requests if batch fails
            _logger.LogInformation("Falling back to individual user requests");
            var fallbackUsers = new List<UserBasicInfo>();
            foreach (var userId in userIds)
            {
                var user = await GetUserBasicInfoAsync(userId);
                if (user != null)
                {
                    fallbackUsers.Add(user);
                }
            }
            return fallbackUsers;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get users info for {UserIds}", string.Join(", ", userIds));
            return new List<UserBasicInfo>();
        }
    }

    private class UserProfileResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public bool IsVerified { get; set; }
        public string? Bio { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public int PostsCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
