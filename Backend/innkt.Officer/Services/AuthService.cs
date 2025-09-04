using innkt.Officer.Data;
using innkt.Officer.Models;
using innkt.Officer.Models.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace innkt.Officer.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AuthResponseDto> RegisterAsync(UserRegistrationDto registrationDto)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(registrationDto.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException("User with this email already exists.");
            }

            // Create new user
            var user = new ApplicationUser
            {
                UserName = registrationDto.Email,
                Email = registrationDto.Email,
                FirstName = registrationDto.FirstName,
                LastName = registrationDto.LastName,
                CountryCode = registrationDto.CountryCode,
                BirthDate = registrationDto.BirthDate,
                Gender = registrationDto.Gender,
                Language = registrationDto.Language,
                Theme = registrationDto.Theme,
                IsJointAccount = registrationDto.IsJointAccount,
                JointAccountEmail = registrationDto.JointAccountEmail,
                JointAccountPassword = registrationDto.JointAccountPassword,
                AcceptTerms = registrationDto.AcceptTerms,
                AcceptPrivacyPolicy = registrationDto.AcceptPrivacyPolicy,
                AcceptMarketing = registrationDto.AcceptMarketing,
                AcceptCookies = registrationDto.AcceptCookies,
                TermsAcceptedAt = registrationDto.AcceptTerms ? DateTime.UtcNow : null,
                PrivacyPolicyAcceptedAt = registrationDto.AcceptPrivacyPolicy ? DateTime.UtcNow : null,
                MarketingAcceptedAt = registrationDto.AcceptMarketing ? DateTime.UtcNow : null,
                CookiesAcceptedAt = registrationDto.AcceptCookies ? DateTime.UtcNow : null
            };

            var result = await _userManager.CreateAsync(user, registrationDto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"User creation failed: {errors}");
            }

            // Generate email confirmation token
            var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            // TODO: Send confirmation email

            // Generate JWT token
            var authResponse = await GenerateAuthResponseAsync(user);

            _logger.LogInformation("User registered successfully: {Email}", user.Email);
            return authResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration for email: {Email}", registrationDto.Email);
            throw;
        }
    }

    public async Task<AuthResponseDto> RegisterJointAccountAsync(JointAccountRegistrationDto jointAccountDto)
    {
        try
        {
            // Check if either email already exists
            var existingPrimary = await _userManager.FindByEmailAsync(jointAccountDto.PrimaryEmail);
            var existingJoint = await _userManager.FindByEmailAsync(jointAccountDto.JointEmail);
            
            if (existingPrimary != null || existingJoint != null)
            {
                throw new InvalidOperationException("One or both emails are already registered.");
            }

            // Create primary user
            var primaryUser = new ApplicationUser
            {
                UserName = jointAccountDto.PrimaryEmail,
                Email = jointAccountDto.PrimaryEmail,
                FirstName = jointAccountDto.PrimaryFirstName,
                LastName = jointAccountDto.PrimaryLastName,
                IsJointAccount = true,
                JointAccountEmail = jointAccountDto.JointEmail,
                JointAccountPassword = jointAccountDto.JointPassword,
                JointAccountStatus = "pending",
                AcceptTerms = jointAccountDto.AcceptTerms,
                AcceptPrivacyPolicy = jointAccountDto.AcceptPrivacyPolicy,
                AcceptMarketing = jointAccountDto.AcceptMarketing,
                AcceptCookies = jointAccountDto.AcceptCookies,
                TermsAcceptedAt = jointAccountDto.AcceptTerms ? DateTime.UtcNow : null,
                PrivacyPolicyAcceptedAt = jointAccountDto.AcceptPrivacyPolicy ? DateTime.UtcNow : null,
                MarketingAcceptedAt = jointAccountDto.AcceptMarketing ? DateTime.UtcNow : null,
                CookiesAcceptedAt = jointAccountDto.AcceptCookies ? DateTime.UtcNow : null
            };

            var primaryResult = await _userManager.CreateAsync(primaryUser, jointAccountDto.PrimaryPassword);
            if (!primaryResult.Succeeded)
            {
                var errors = string.Join(", ", primaryResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Primary user creation failed: {errors}");
            }

            // Create joint user
            var jointUser = new ApplicationUser
            {
                UserName = jointAccountDto.JointEmail,
                Email = jointAccountDto.JointEmail,
                FirstName = jointAccountDto.JointFirstName,
                LastName = jointAccountDto.JointLastName,
                IsJointAccount = true,
                JointAccountEmail = jointAccountDto.PrimaryEmail,
                JointAccountPassword = jointAccountDto.PrimaryPassword,
                JointAccountStatus = "pending",
                AcceptTerms = jointAccountDto.AcceptTerms,
                AcceptPrivacyPolicy = jointAccountDto.AcceptPrivacyPolicy,
                AcceptMarketing = jointAccountDto.AcceptMarketing,
                AcceptCookies = jointAccountDto.AcceptCookies,
                TermsAcceptedAt = jointAccountDto.AcceptTerms ? DateTime.UtcNow : null,
                PrivacyPolicyAcceptedAt = jointAccountDto.AcceptPrivacyPolicy ? DateTime.UtcNow : null,
                MarketingAcceptedAt = jointAccountDto.AcceptMarketing ? DateTime.UtcNow : null,
                CookiesAcceptedAt = jointAccountDto.AcceptCookies ? DateTime.UtcNow : null
            };

            var jointResult = await _userManager.CreateAsync(jointUser, jointAccountDto.JointPassword);
            if (!jointResult.Succeeded)
            {
                // Rollback primary user creation
                await _userManager.DeleteAsync(primaryUser);
                var errors = string.Join(", ", jointResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Joint user creation failed: {errors}");
            }

            // Link the accounts
            primaryUser.LinkedUserId = jointUser.Id;
            jointUser.LinkedUserId = primaryUser.Id;
            primaryUser.JointAccountStatus = "active";
            jointUser.JointAccountStatus = "active";

            await _userManager.UpdateAsync(primaryUser);
            await _userManager.UpdateAsync(jointUser);

            // Generate JWT token for primary user
            var authResponse = await GenerateAuthResponseAsync(primaryUser, jointUser);

            _logger.LogInformation("Joint account registered successfully: {PrimaryEmail} and {JointEmail}", 
                primaryUser.Email, jointUser.Email);
            
            return authResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during joint account registration");
            throw;
        }
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
            {
                throw new InvalidOperationException("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                throw new InvalidOperationException("Account is deactivated.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException("Invalid email or password.");
            }

            // Get linked user if this is a joint account
            ApplicationUser? linkedUser = null;
            if (user.IsJointAccount && !string.IsNullOrEmpty(user.LinkedUserId))
            {
                linkedUser = await _userManager.FindByIdAsync(user.LinkedUserId);
            }

            var authResponse = await GenerateAuthResponseAsync(user, linkedUser);

            _logger.LogInformation("User logged in successfully: {Email}", user.Email);
            return authResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", loginDto.Email);
            throw;
        }
    }

    public async Task<AuthResponseDto> LoginJointAccountAsync(JointAccountLoginDto jointLoginDto)
    {
        try
        {
            // Find primary user
            var primaryUser = await _userManager.FindByEmailAsync(jointLoginDto.Email);
            if (primaryUser == null || !primaryUser.IsJointAccount)
            {
                throw new InvalidOperationException("Invalid joint account credentials.");
            }

            // Verify primary password
            var primaryResult = await _signInManager.CheckPasswordSignInAsync(primaryUser, jointLoginDto.Password, false);
            if (!primaryResult.Succeeded)
            {
                throw new InvalidOperationException("Invalid primary account credentials.");
            }

            // Find and verify joint user
            var jointUser = await _userManager.FindByEmailAsync(jointLoginDto.JointEmail);
            if (jointUser == null || !jointUser.IsJointAccount || jointUser.LinkedUserId != primaryUser.Id)
            {
                throw new InvalidOperationException("Invalid joint account credentials.");
            }

            var jointResult = await _signInManager.CheckPasswordSignInAsync(jointUser, jointLoginDto.JointPassword, false);
            if (!jointResult.Succeeded)
            {
                throw new InvalidOperationException("Invalid joint account credentials.");
            }

            var authResponse = await GenerateAuthResponseAsync(primaryUser, jointUser);

            _logger.LogInformation("Joint account logged in successfully: {PrimaryEmail} and {JointEmail}", 
                primaryUser.Email, jointUser.Email);
            
            return authResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during joint account login");
            throw;
        }
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            // TODO: Implement refresh token validation and generation
            throw new NotImplementedException("Refresh token functionality not yet implemented.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            throw;
        }
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return false;
            }

            var result = await _userManager.ChangePasswordAsync(user, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
            return result.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user: {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(forgotPasswordDto.Email);
            if (user == null)
            {
                // Don't reveal if user exists
                return true;
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            // TODO: Send password reset email
            await Task.CompletedTask; // Placeholder for async operation
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password for email: {Email}", forgotPasswordDto.Email);
            return false;
        }
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto resetPasswordDto)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(resetPasswordDto.Email);
            if (user == null)
            {
                return false;
            }

            var result = await _userManager.ResetPasswordAsync(user, resetPasswordDto.Token, resetPasswordDto.NewPassword);
            return result.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset for email: {Email}", resetPasswordDto.Email);
            return false;
        }
    }

    public async Task<bool> LinkAccountAsync(string primaryUserId, string secondaryUserId)
    {
        try
        {
            var primaryUser = await _userManager.FindByIdAsync(primaryUserId);
            var secondaryUser = await _userManager.FindByIdAsync(secondaryUserId);

            if (primaryUser == null || secondaryUser == null)
            {
                return false;
            }

            if (primaryUser.IsJointAccount || secondaryUser.IsJointAccount)
            {
                return false; // Already linked
            }

            primaryUser.LinkedUserId = secondaryUserId;
            secondaryUser.LinkedUserId = primaryUserId;
            primaryUser.IsJointAccount = true;
            secondaryUser.IsJointAccount = true;

            await _userManager.UpdateAsync(primaryUser);
            await _userManager.UpdateAsync(secondaryUser);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error linking accounts: {PrimaryUserId} and {SecondaryUserId}", primaryUserId, secondaryUserId);
            return false;
        }
    }

    public async Task<bool> UnlinkAccountAsync(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.IsJointAccount)
            {
                return false;
            }

            var linkedUser = await _userManager.FindByIdAsync(user.LinkedUserId!);
            if (linkedUser != null)
            {
                linkedUser.LinkedUserId = null;
                linkedUser.IsJointAccount = false;
                await _userManager.UpdateAsync(linkedUser);
            }

            user.LinkedUserId = null;
            user.IsJointAccount = false;
            await _userManager.UpdateAsync(user);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unlinking account for user: {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> VerifyEmailAsync(string userId, string token)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return false;
            }

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (result.Succeeded)
            {
                user.IsEmailVerified = true;
                user.EmailVerifiedAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);
            }

            return result.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying email for user: {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> ResendEmailVerificationAsync(string email)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return false;
            }

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            // TODO: Send confirmation email
            await Task.CompletedTask; // Placeholder for async operation
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending email verification for: {Email}", email);
            return false;
        }
    }

    public async Task<bool> LogoutAsync(string userId)
    {
        try
        {
                    // TODO: Implement token blacklisting or invalidation
        await Task.CompletedTask; // Placeholder for async operation
        return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout for user: {UserId}", userId);
            return false;
        }
    }

    private async Task<AuthResponseDto> GenerateAuthResponseAsync(ApplicationUser user, ApplicationUser? linkedUser = null)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
            new Claim("isJointAccount", user.IsJointAccount.ToString()),
            new Claim("language", user.Language),
            new Claim("theme", user.Theme)
        };

        if (linkedUser != null)
        {
            claims.Add(new Claim("linkedUserId", linkedUser.Id ?? ""));
            claims.Add(new Claim("linkedUserEmail", linkedUser.Email ?? ""));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "default-key-change-in-production"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        var tokenHandler = new JwtSecurityTokenHandler();
        var accessToken = tokenHandler.WriteToken(token);

        var refreshToken = GenerateRefreshToken();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = token.ValidTo,
            User = MapToUserDto(user),
            IsJointAccount = user.IsJointAccount,
            LinkedUser = linkedUser != null ? MapToUserDto(linkedUser) : null
        };
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private UserDto MapToUserDto(ApplicationUser user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Language = user.Language,
            Theme = user.Theme,
            IsEmailVerified = user.IsEmailVerified,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}
