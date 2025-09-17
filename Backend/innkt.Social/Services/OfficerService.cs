using System.Text.Json;
using innkt.Social.DTOs;

namespace innkt.Social.Services;

public class OfficerService : IOfficerService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OfficerService> _logger;
    private readonly IConfiguration _configuration;

    public OfficerService(HttpClient httpClient, ILogger<OfficerService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
        
        // Configure the base URL for the Officer service
        var officerUrl = _configuration["OfficerService:BaseUrl"] ?? "http://localhost:5001";
        _httpClient.BaseAddress = new Uri(officerUrl);
    }

    public async Task<UserSearchResult?> SearchUsersAsync(string query, int page = 1, int limit = 20)
    {
        try
        {
            _logger.LogInformation("Searching users in Officer service with query: {Query}", query);
            
            var response = await _httpClient.GetAsync($"/api/User/search?query={Uri.EscapeDataString(query)}&page={page}&limit={limit}");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var searchResult = JsonSerializer.Deserialize<UserSearchResult>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                _logger.LogInformation("Found {Count} users from Officer service", searchResult?.Users?.Count ?? 0);
                return searchResult;
            }
            else
            {
                _logger.LogWarning("Officer service returned {StatusCode} for user search", response.StatusCode);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users in Officer service");
            return null;
        }
    }

    public async Task<UserBasicInfo?> GetUserByIdAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("Getting user by ID from Officer service: {UserId}", userId);
            
            var response = await _httpClient.GetAsync($"/api/User/{userId}");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var userResponse = JsonSerializer.Deserialize<JsonElement>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                // Map the Officer service response to UserBasicInfo
                var user = new UserBasicInfo
                {
                    Id = Guid.Parse(userResponse.GetProperty("id").GetString() ?? Guid.Empty.ToString()),
                    Username = userResponse.GetProperty("username").GetString() ?? "",
                    DisplayName = userResponse.GetProperty("fullName").GetString() ?? "",
                    Email = userResponse.GetProperty("email").GetString(),
                    AvatarUrl = userResponse.GetProperty("profilePictureUrl").GetString(),
                    IsVerified = userResponse.GetProperty("isVerified").GetBoolean()
                };
                
                return user;
            }
            else
            {
                _logger.LogWarning("Officer service returned {StatusCode} for user {UserId}", response.StatusCode, userId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID from Officer service: {UserId}", userId);
            return null;
        }
    }

    public async Task<UserBasicInfo?> GetUserByUsernameAsync(string username)
    {
        try
        {
            _logger.LogInformation("Getting user by username from Officer service: {Username}", username);
            
            var response = await _httpClient.GetAsync($"/api/User/username/{Uri.EscapeDataString(username)}");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var user = JsonSerializer.Deserialize<UserBasicInfo>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                return user;
            }
            else
            {
                _logger.LogWarning("Officer service returned {StatusCode} for username {Username}", response.StatusCode, username);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by username from Officer service: {Username}", username);
            return null;
        }
    }

    public async Task<Dictionary<Guid, UserBasicInfo>> GetUsersByIdsAsync(IEnumerable<Guid> userIds)
    {
        var result = new Dictionary<Guid, UserBasicInfo>();
        
        if (!userIds.Any())
            return result;

        try
        {
            var userIdList = userIds.ToList();
            _logger.LogInformation("Batch loading {Count} users from Officer service", userIdList.Count);
            
            // Create batch request payload
            var requestPayload = new
            {
                UserIds = userIdList
            };
            
            var json = JsonSerializer.Serialize(requestPayload);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync("/api/User/batch", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var usersArray = JsonSerializer.Deserialize<JsonElement[]>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (usersArray != null)
                {
                    foreach (var userElement in usersArray)
                    {
                        try
                        {
                            var user = new UserBasicInfo
                            {
                                Id = Guid.Parse(userElement.GetProperty("id").GetString() ?? Guid.Empty.ToString()),
                                Username = userElement.GetProperty("username").GetString() ?? "",
                                DisplayName = userElement.GetProperty("fullName").GetString() ?? "",
                                Email = userElement.GetProperty("email").GetString(),
                                AvatarUrl = userElement.GetProperty("profilePictureUrl").GetString(),
                                IsVerified = userElement.GetProperty("isVerified").GetBoolean()
                            };
                            
                            result[user.Id] = user;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to parse user data from batch response");
                        }
                    }
                }
                
                _logger.LogInformation("Successfully loaded {Count} users from Officer service", result.Count);
            }
            else
            {
                _logger.LogWarning("Officer service batch request returned {StatusCode}", response.StatusCode);
                
                // Fallback: Load users individually
                _logger.LogInformation("Falling back to individual user requests");
                await LoadUsersIndividuallyAsync(userIdList, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in batch user loading from Officer service");
            
            // Fallback: Load users individually
            var userIdList = userIds.ToList();
            _logger.LogInformation("Falling back to individual user requests");
            await LoadUsersIndividuallyAsync(userIdList, result);
        }
        
        return result;
    }

    public async Task<List<UserBasicInfo>> GetUsersAsync(IEnumerable<Guid> userIds)
    {
        var usersDict = await GetUsersByIdsAsync(userIds);
        return usersDict.Values.ToList();
    }

    private async Task LoadUsersIndividuallyAsync(List<Guid> userIds, Dictionary<Guid, UserBasicInfo> result)
    {
        var tasks = userIds.Select(async userId =>
        {
            try
            {
                var user = await GetUserByIdAsync(userId);
                if (user != null)
                {
                    lock (result)
                    {
                        result[userId] = user;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load individual user {UserId}", userId);
            }
        });

        await Task.WhenAll(tasks);
        _logger.LogInformation("Loaded {Count} users individually", result.Count);
    }
}
