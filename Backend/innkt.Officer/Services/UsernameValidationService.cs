using Microsoft.AspNetCore.Identity;
using innkt.Officer.Models;
using System.Text.RegularExpressions;

namespace innkt.Officer.Services;

/// <summary>
/// Service for validating usernames across all account types
/// </summary>
public interface IUsernameValidationService
{
    Task<UsernameValidationResult> ValidateUsernameAsync(string username, string? excludeUserId = null);
    bool IsValidUsernameFormat(string username);
    Task<bool> IsUsernameAvailableAsync(string username, string? excludeUserId = null);
}

public class UsernameValidationService : IUsernameValidationService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UsernameValidationService> _logger;

    // Username format: lowercase alphanumeric characters and dots only, 3-30 characters
    private static readonly Regex UsernameRegex = new Regex(@"^[a-z0-9.]+$", RegexOptions.Compiled);
    private const int MinLength = 3;
    private const int MaxLength = 30;

    public UsernameValidationService(
        UserManager<ApplicationUser> userManager,
        ILogger<UsernameValidationService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<UsernameValidationResult> ValidateUsernameAsync(string username, string? excludeUserId = null)
    {
        var result = new UsernameValidationResult
        {
            IsValid = true,
            Username = username
        };

        // Check if username is null or empty
        if (string.IsNullOrWhiteSpace(username))
        {
            result.IsValid = false;
            result.Errors.Add("Username is required");
            return result;
        }

        // Trim whitespace
        username = username.Trim();
        result.Username = username;

        // Check length
        if (username.Length < MinLength)
        {
            result.IsValid = false;
            result.Errors.Add($"Username must be at least {MinLength} characters long");
        }

        if (username.Length > MaxLength)
        {
            result.IsValid = false;
            result.Errors.Add($"Username must be no more than {MaxLength} characters long");
        }

        // Check format (lowercase alphanumeric and dots only)
        if (!IsValidUsernameFormat(username))
        {
            result.IsValid = false;
            result.Errors.Add("Username can only contain lowercase letters, numbers, and dots (.)");
        }

        // Check for reserved usernames
        if (IsReservedUsername(username))
        {
            result.IsValid = false;
            result.Errors.Add("This username is reserved and cannot be used");
        }

        // Check for consecutive dots
        if (username.Contains(".."))
        {
            result.IsValid = false;
            result.Errors.Add("Username cannot contain consecutive dots");
        }

        // Check if username starts or ends with dot
        if (username.StartsWith(".") || username.EndsWith("."))
        {
            result.IsValid = false;
            result.Errors.Add("Username cannot start or end with a dot");
        }

        // If format is valid, check availability
        if (result.IsValid)
        {
            var isAvailable = await IsUsernameAvailableAsync(username, excludeUserId);
            if (!isAvailable)
            {
                result.IsValid = false;
                result.Errors.Add("This username is already taken");
            }
        }

        _logger.LogInformation("Username validation for '{Username}': {IsValid} - {Errors}", 
            username, result.IsValid, string.Join(", ", result.Errors));

        return result;
    }

    public bool IsValidUsernameFormat(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return false;

        return UsernameRegex.IsMatch(username) && 
               username.Length >= MinLength && 
               username.Length <= MaxLength;
    }

    public async Task<bool> IsUsernameAvailableAsync(string username, string? excludeUserId = null)
    {
        try
        {
            var user = await _userManager.FindByNameAsync(username);
            
            // If no user found, username is available
            if (user == null)
                return true;

            // If excludeUserId is provided and it matches the found user, it's available (updating same user)
            if (!string.IsNullOrEmpty(excludeUserId) && user.Id == excludeUserId)
                return true;

            // Username is taken by another user
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking username availability for '{Username}'", username);
            return false; // Assume not available on error to be safe
        }
    }

    private bool IsReservedUsername(string username)
    {
        var reservedUsernames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            // System accounts
            "admin", "administrator", "root", "system", "support", "help",
            "api", "www", "mail", "email", "noreply", "no-reply",
            
            // Platform features
            "innkt", "innktapp", "innktapp.com", "app", "platform",
            "social", "messaging", "groups", "notifications",
            
            // Common reserved words
            "null", "undefined", "true", "false", "test", "demo",
            "guest", "anonymous", "user", "account", "profile",
            
            // Kid safety
            "kid", "kids", "child", "children", "parent", "parents",
            "family", "guardian", "teacher", "school",
            
            // Moderation
            "mod", "moderator", "moderators", "staff", "team",
            "abuse", "report", "reports", "spam", "bot", "bots",
            
            // Common social media reserved
            "follow", "following", "followers", "like", "likes",
            "post", "posts", "comment", "comments", "share", "shares",
            "notification", "notifications", "settings", "privacy",
            "terms", "policy", "policies", "legal", "tos", "tos.html",
            
            // File extensions and common formats
            "css", "js", "html", "htm", "xml", "json", "pdf", "doc",
            "jpg", "jpeg", "png", "gif", "svg", "ico", "favicon",
            
            // Common subdomains and paths
            "blog", "news", "forum", "forums", "chat", "shop", "store",
            "login", "logout", "register", "signup", "signin", "auth",
            "dashboard", "home", "index", "main", "default"
        };

        return reservedUsernames.Contains(username.ToLower());
    }
}

public class UsernameValidationResult
{
    public bool IsValid { get; set; }
    public string Username { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();

    public string GetErrorMessage()
    {
        return string.Join("; ", Errors);
    }

    public string GetFirstError()
    {
        return Errors.FirstOrDefault() ?? "Invalid username";
    }
}
