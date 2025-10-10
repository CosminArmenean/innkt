using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using innkt.Officer.Models;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/auth")]
[Authorize]
public class AccountSwitchingController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AccountSwitchingController> _logger;

    public AccountSwitchingController(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        ILogger<AccountSwitchingController> logger)
    {
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Switch parent account to act as kid account
    /// </summary>
    [HttpPost("switch-to-kid")]
    public async Task<ActionResult<SwitchAccountResponse>> SwitchToKidAccount([FromBody] SwitchToKidRequest request)
    {
        try
        {
            // Get current user (parent) from JWT
            var parentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(parentId))
                return Unauthorized();

            var parent = await _userManager.FindByIdAsync(parentId);
            if (parent == null)
                return NotFound(new { error = "Parent account not found" });

            // Get kid account
            var kid = await _userManager.FindByIdAsync(request.KidAccountId);
            if (kid == null)
                return NotFound(new { error = "Kid account not found" });

            // Verify parent relationship
            if (kid.ParentUserId != parentId)
                return Forbid();

            // Generate new JWT token with kid context
            var token = GenerateKidSwitchToken(parent, kid);

            _logger.LogInformation("Parent {ParentId} switched to kid account {KidId}", parentId, kid.Id);

            return Ok(new SwitchAccountResponse
            {
                AccessToken = token,
                ActingAsUserId = kid.Id,
                ActingAsUsername = kid.UserName ?? "",
                ActingAsDisplayName = kid.DisplayName ?? "",
                IsActingAsKid = true,
                ParentUserId = parentId,
                ParentUsername = parent.UserName ?? ""
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error switching to kid account");
            return StatusCode(500, new { error = "Failed to switch account" });
        }
    }

    /// <summary>
    /// Switch back to parent account
    /// </summary>
    [HttpPost("switch-back-to-parent")]
    public async Task<ActionResult<SwitchAccountResponse>> SwitchBackToParent()
    {
        try
        {
            // Get parent ID from claims
            var parentId = User.FindFirstValue("originalParentId");
            if (string.IsNullOrEmpty(parentId))
                return BadRequest(new { error = "Not acting as kid account" });

            var parent = await _userManager.FindByIdAsync(parentId);
            if (parent == null)
                return NotFound(new { error = "Parent account not found" });

            // Generate normal JWT token for parent
            var token = GenerateStandardToken(parent);

            _logger.LogInformation("Parent {ParentId} switched back to own account", parentId);

            return Ok(new SwitchAccountResponse
            {
                AccessToken = token,
                ActingAsUserId = parentId,
                ActingAsUsername = parent.UserName ?? "",
                ActingAsDisplayName = parent.DisplayName ?? "",
                IsActingAsKid = false,
                ParentUserId = parentId,
                ParentUsername = parent.UserName ?? ""
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error switching back to parent");
            return StatusCode(500, new { error = "Failed to switch account" });
        }
    }

    /// <summary>
    /// Get current acting-as status
    /// </summary>
    [HttpGet("current-acting-as")]
    public ActionResult<ActingAsResponse> GetCurrentActingAs()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var originalParentId = User.FindFirstValue("originalParentId");
        var isActingAsKid = !string.IsNullOrEmpty(originalParentId);

        return Ok(new ActingAsResponse
        {
            CurrentUserId = userId ?? "",
            IsActingAsKid = isActingAsKid,
            OriginalParentId = originalParentId
        });
    }

    #region Private Methods

    private string GenerateKidSwitchToken(ApplicationUser parent, ApplicationUser kid)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, kid.Id),
            new Claim(ClaimTypes.Email, kid.Email ?? ""),
            new Claim(ClaimTypes.Name, kid.FullName ?? kid.UserName ?? ""),
            new Claim("isKidAccount", "true"),
            new Claim("isActingAsKid", "true"),
            new Claim("originalParentId", parent.Id),
            new Claim("originalParentEmail", parent.Email ?? ""),
            new Claim("parentUserId", parent.Id)
        };

        return GenerateToken(claims);
    }

    private string GenerateStandardToken(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Name, user.FullName ?? user.UserName ?? ""),
            new Claim("firstName", user.FirstName ?? ""),
            new Claim("lastName", user.LastName ?? "")
        };

        return GenerateToken(claims);
    }

    private string GenerateToken(List<Claim> claims)
    {
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

    #endregion
}

#region Request/Response Models

public class SwitchToKidRequest
{
    public string KidAccountId { get; set; } = string.Empty;
}

public class SwitchAccountResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string ActingAsUserId { get; set; } = string.Empty;
    public string ActingAsUsername { get; set; } = string.Empty;
    public string ActingAsDisplayName { get; set; } = string.Empty;
    public bool IsActingAsKid { get; set; }
    public string ParentUserId { get; set; } = string.Empty;
    public string ParentUsername { get; set; } = string.Empty;
}

public class ActingAsResponse
{
    public string CurrentUserId { get; set; } = string.Empty;
    public bool IsActingAsKid { get; set; }
    public string? OriginalParentId { get; set; }
}

#endregion

