using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using innkt.Officer.Models;
using innkt.Officer.Services;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/kid-auth")]
public class KidAuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<KidAuthController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public KidAuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<KidAuthController> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    /// <summary>
    /// Login kid account using login code from Kinder service
    /// </summary>
    [HttpPost("login-with-code")]
    public async Task<ActionResult<KidAuthResponse>> LoginWithCode([FromBody] KidLoginRequest request)
    {
        try
        {
            _logger.LogInformation("Kid login attempt with code: {Code}", request.Code);

            // Step 1: Validate code with Kinder service
            var kinderServiceUrl = _configuration["Services:Kinder:BaseUrl"] ?? "http://localhost:5004";
            var httpClient = _httpClientFactory.CreateClient();

            var validationRequest = new
            {
                code = request.Code
            };

            var response = await httpClient.PostAsJsonAsync(
                $"{kinderServiceUrl}/api/kinder/validate-login-code",
                validationRequest
            );

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Kinder service validation failed for code: {Code}", request.Code);
                return BadRequest(new { error = "Invalid or expired login code" });
            }

            var validationResult = await response.Content.ReadFromJsonAsync<KinderValidationResponse>();

            if (validationResult == null || !validationResult.IsValid)
            {
                _logger.LogWarning("Login code validation failed: {Message}", validationResult?.Message);
                return BadRequest(new { error = validationResult?.Message ?? "Invalid login code" });
            }

            // Step 2: Find the user by the UserId from Kinder service
            var user = await _userManager.FindByIdAsync(validationResult.UserId);

            if (user == null)
            {
                _logger.LogError("User not found for validated code. UserId: {UserId}", validationResult.UserId);
                return BadRequest(new { error = "User account not found" });
            }

            // Step 3: Verify this is a kid account
            if (!user.IsKidAccount)
            {
                _logger.LogWarning("Attempt to use kid login code for non-kid account: {UserId}", user.Id);
                return BadRequest(new { error = "This account is not a kid account" });
            }

            // Step 4: Sign in the user
            await _signInManager.SignInAsync(user, isPersistent: false);

            // Step 5: Generate JWT token
            var token = await GenerateJwtTokenAsync(user);

            _logger.LogInformation("Kid account logged in successfully: {UserId}", user.Id);

            return Ok(new KidAuthResponse
            {
                UserId = user.Id,
                Username = user.UserName ?? "",
                DisplayName = user.DisplayName ?? "",
                AccessToken = token,
                ExpiresIn = 3600, // 1 hour
                IsKidAccount = true,
                KidAccountId = validationResult.KidAccountId ?? user.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during kid login with code");
            return StatusCode(500, new { error = "Login failed. Please try again." });
        }
    }

    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Name, user.FullName ?? user.UserName ?? ""),
            new Claim("firstName", user.FirstName ?? ""),
            new Claim("lastName", user.LastName ?? ""),
            new Claim("isKidAccount", user.IsKidAccount.ToString()),
            new Claim("language", user.Language ?? "en"),
            new Claim("theme", user.Theme ?? "light")
        };

        if (user.ParentUserId != null)
        {
            claims.Add(new Claim("parentUserId", user.ParentUserId));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? "default-key-change-in-production"
        ));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        var tokenHandler = new JwtSecurityTokenHandler();
        return tokenHandler.WriteToken(token);
    }
}

#region Request/Response Models

public class KidLoginRequest
{
    public string Code { get; set; } = string.Empty;
}

public class KidAuthResponse
{
    public string UserId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public bool IsKidAccount { get; set; }
    public string KidAccountId { get; set; } = string.Empty;
}

public class KinderValidationResponse
{
    public bool IsValid { get; set; }
    public string? KidAccountId { get; set; }
    public string? UserId { get; set; }
    public string Message { get; set; } = string.Empty;
}

#endregion

