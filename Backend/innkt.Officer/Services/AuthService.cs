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

            // Check if username already exists
            var existingUserByUsername = await _userManager.FindByNameAsync(registrationDto.Username);
            if (existingUserByUsername != null)
            {
                throw new InvalidOperationException("User with this username already exists.");
            }

            // Create new user
            var user = new ApplicationUser
            {
                UserName = registrationDto.Username,
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

            // Handle profile picture upload if provided
            if (!string.IsNullOrEmpty(registrationDto.ProfilePictureBase64))
            {
                try
                {
                    var profilePictureUrl = await SaveProfilePictureAsync(user.Id, registrationDto.ProfilePictureBase64);
                    user.ProfilePictureUrl = profilePictureUrl;
                    await _userManager.UpdateAsync(user);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to save profile picture for user {UserId}", user.Id);
                }
            }

            // Create subaccounts if provided
            if (registrationDto.Subaccounts != null && registrationDto.Subaccounts.Any())
            {
                await CreateSubaccountsAsync(user.Id, registrationDto.Subaccounts);
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
            Console.WriteLine($"Error during user registration for email: {registrationDto.Email}. Error: {ex.Message}");
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
            Console.WriteLine($"Error during joint account registration: {ex.Message}");
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
            Console.WriteLine($"Error during login for email: {loginDto.Email}. Error: {ex.Message}");
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
            Console.WriteLine($"Error during joint account login: {ex.Message}");
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
            Console.WriteLine($"Error during token refresh: {ex.Message}");
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
            Console.WriteLine($"Error changing password for user: {userId}. Error: {ex.Message}");
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
            Console.WriteLine($"Error during forgot password for email: {forgotPasswordDto.Email}. Error: {ex.Message}");
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
            Console.WriteLine($"Error during password reset for email: {resetPasswordDto.Email}. Error: {ex.Message}");
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
            Console.WriteLine($"Error linking accounts: {primaryUserId} and {secondaryUserId}. Error: {ex.Message}");
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
            Console.WriteLine($"Error unlinking account for user: {userId}. Error: {ex.Message}");
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
            Console.WriteLine($"Error verifying email for user: {userId}. Error: {ex.Message}");
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
            Console.WriteLine($"Error resending email verification for: {email}. Error: {ex.Message}");
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
            Console.WriteLine($"Error during logout for user: {userId}. Error: {ex.Message}");
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
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256, "innkt-officer-key");

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

    public async Task<UserProfileDto> GetUserProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        return MapToUserProfileDto(user);
    }

    public async Task<UserProfileDto> GetUserByUsernameAsync(string username)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        return MapToUserProfileDto(user);
    }

    public async Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateUserProfileDto updateDto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        // Update user properties
        if (!string.IsNullOrEmpty(updateDto.Username))
        {
            // Check if username is already taken by another user
            var existingUser = await _userManager.FindByNameAsync(updateDto.Username);
            if (existingUser != null && existingUser.Id != userId)
            {
                throw new InvalidOperationException("Username is already taken by another user.");
            }
            user.UserName = updateDto.Username;
        }
        
        if (!string.IsNullOrEmpty(updateDto.FirstName))
            user.FirstName = updateDto.FirstName;
        
        if (!string.IsNullOrEmpty(updateDto.LastName))
            user.LastName = updateDto.LastName;
        
        if (!string.IsNullOrEmpty(updateDto.Bio))
            user.Bio = updateDto.Bio;
        
        if (!string.IsNullOrEmpty(updateDto.Location))
            user.City = updateDto.Location; // Using City as Location
        
        if (!string.IsNullOrEmpty(updateDto.PhoneNumber))
            user.PhoneNumber = updateDto.PhoneNumber;
        
        if (!string.IsNullOrEmpty(updateDto.Address))
            user.Address = updateDto.Address;
        
        if (!string.IsNullOrEmpty(updateDto.City))
            user.City = updateDto.City;
        
        if (!string.IsNullOrEmpty(updateDto.State))
            user.State = updateDto.State;
        
        if (!string.IsNullOrEmpty(updateDto.Country))
            user.Country = updateDto.Country;
        
        if (!string.IsNullOrEmpty(updateDto.PostalCode))
            user.PostalCode = updateDto.PostalCode;
        
        if (updateDto.DateOfBirth.HasValue)
            user.BirthDate = updateDto.DateOfBirth.Value;
        
        if (!string.IsNullOrEmpty(updateDto.ProfilePictureUrl))
            user.ProfilePictureUrl = updateDto.ProfilePictureUrl;

        // Update the user in the database
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException($"Failed to update user profile: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        // Return the updated profile
        return MapToUserProfileDto(user);
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

    private UserProfileDto MapToUserProfileDto(ApplicationUser user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Username = user.UserName ?? user.Email,
            Bio = user.Bio,
            Location = user.City, // Using City as location
            Website = null, // Not available in ApplicationUser
            DateOfBirth = user.BirthDate,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Language = user.Language,
            Theme = user.Theme,
            IsEmailVerified = user.IsEmailVerified,
            IsActive = user.IsActive,
            IsVerified = user.IsVerified,
            IsKidAccount = user.IsKidAccount,
            ParentId = user.ParentUserId,
            IndependenceDate = user.KidIndependenceDate,
            FollowersCount = 0, // Not available in ApplicationUser
            FollowingCount = 0, // Not available in ApplicationUser
            PostsCount = 0, // Not available in ApplicationUser
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Preferences = new UserPreferencesDto
            {
                PrivacyLevel = user.IsPrivate ? "private" : "public",
                AllowDirectMessages = true, // Default value
                AllowMentions = true, // Default value
                NotificationSettings = new NotificationSettingsDto
                {
                    NewFollowers = true, // Default value
                    NewPosts = true, // Default value
                    Mentions = true, // Default value
                    DirectMessages = true, // Default value
                    GroupUpdates = true, // Default value
                    EmailNotifications = true, // Default value
                    PushNotifications = true // Default value
                },
                Theme = user.Theme,
                Language = user.Language,
                Timezone = "UTC" // Default value
            },
            SocialLinks = new SocialLinksDto
            {
                Twitter = null, // Not available in ApplicationUser
                Instagram = null, // Not available in ApplicationUser
                LinkedIn = null, // Not available in ApplicationUser
                Facebook = null, // Not available in ApplicationUser
                YouTube = null // Not available in ApplicationUser
            },
            ParentalControls = user.IsKidAccount ? new ParentalControlsDto
            {
                CanPost = true, // Default value
                CanMessage = true, // Default value
                CanJoinGroups = true, // Default value
                CanViewContent = "all", // Default value
                TimeRestrictions = new TimeRestrictionsDto
                {
                    Enabled = false, // Default value
                    StartTime = "08:00", // Default value
                    EndTime = "22:00", // Default value
                    Timezone = "UTC" // Default value
                },
                ContentFilters = new List<string>(), // Default value
                AllowedContacts = new List<string>() // Default value
            } : null
        };
    }

    // Helper method to create subaccounts during registration
    private async Task CreateSubaccountsAsync(string parentUserId, List<SubaccountDto> subaccounts)
    {
        foreach (var subaccount in subaccounts)
        {
            try
            {
                // Check if username is already taken
                var existingUser = await _userManager.FindByNameAsync(subaccount.Username);
                if (existingUser != null)
                {
                    _logger.LogWarning("Subaccount username {Username} already exists, skipping", subaccount.Username);
                    continue;
                }

                // Create kid account
                var kidUser = new ApplicationUser
                {
                    UserName = subaccount.Username,
                    Email = $"{subaccount.Username}@kid.innkt.local", // Temporary email for kid accounts
                    FirstName = subaccount.FirstName,
                    LastName = subaccount.LastName,
                    BirthDate = subaccount.BirthDate,
                    Gender = subaccount.Gender,
                    IsKidAccount = true,
                    ParentUserId = parentUserId,
                    KidAccountStatus = "active",
                    KidAccountCreatedAt = DateTime.UtcNow,
                    Language = "en",
                    Theme = "light",
                    IsActive = true,
                    AcceptTerms = true,
                    AcceptPrivacyPolicy = true,
                    AcceptMarketing = false,
                    AcceptCookies = false,
                    TermsAcceptedAt = DateTime.UtcNow,
                    PrivacyPolicyAcceptedAt = DateTime.UtcNow
                };

                // Generate a temporary password for kid account
                var tempPassword = GenerateTemporaryPassword();
                var result = await _userManager.CreateAsync(kidUser, tempPassword);
                
                if (result.Succeeded)
                {
                    // Handle profile picture if provided
                    if (!string.IsNullOrEmpty(subaccount.ProfilePictureBase64))
                    {
                        try
                        {
                            var profilePictureUrl = await SaveProfilePictureAsync(kidUser.Id, subaccount.ProfilePictureBase64);
                            kidUser.ProfilePictureUrl = profilePictureUrl;
                            await _userManager.UpdateAsync(kidUser);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to save profile picture for subaccount {SubaccountId}", kidUser.Id);
                        }
                    }

                    _logger.LogInformation("Subaccount created successfully: {Username} for parent {ParentId}", subaccount.Username, parentUserId);
                }
                else
                {
                    Console.WriteLine($"Failed to create subaccount {subaccount.Username}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating subaccount {subaccount.Username} for parent {parentUserId}: {ex.Message}");
            }
        }
    }

    // Helper method to save profile picture from base64
    private async Task<string> SaveProfilePictureAsync(string userId, string base64Image)
    {
        try
        {
            // Remove data URL prefix if present
            var base64Data = base64Image.Contains(",") ? base64Image.Split(',')[1] : base64Image;
            var imageBytes = Convert.FromBase64String(base64Data);
            
            // Create filename
            var fileName = $"{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}.jpg";
            var filePath = Path.Combine("wwwroot", "uploads", "profiles", fileName);
            
            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);
            
            // Save file
            await File.WriteAllBytesAsync(filePath, imageBytes);
            
            // Return relative URL
            return $"/uploads/profiles/{fileName}";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving profile picture for user {userId}: {ex.Message}");
            throw;
        }
    }

    // Helper method to generate temporary password for kid accounts
    private string GenerateTemporaryPassword()
    {
        // Generate a secure temporary password
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 12)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    public async Task<List<ApplicationUser>> SearchUsersAsync(string query, int page = 1, int limit = 20)
    {
        try
        {
            _logger.LogInformation("Searching users with query: {Query}, page: {Page}, limit: {Limit}", query, page, limit);

            var users = await _userManager.Users
                .Where(u => 
                    u.UserName!.Contains(query) ||
                    u.FirstName!.Contains(query) ||
                    u.LastName!.Contains(query) ||
                    u.Email!.Contains(query))
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            _logger.LogInformation("Found {Count} users matching query: {Query}", users.Count, query);
            return users;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error searching users with query: {query}. Error: {ex.Message}");
            return new List<ApplicationUser>();
        }
    }
}
