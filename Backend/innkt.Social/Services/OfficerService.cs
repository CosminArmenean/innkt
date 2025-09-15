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
                var user = JsonSerializer.Deserialize<UserBasicInfo>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
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
}
