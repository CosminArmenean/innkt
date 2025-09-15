using innkt.Officer.Models.DTOs;
using innkt.Officer.Models;

namespace innkt.Officer.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(UserRegistrationDto registrationDto);
    Task<AuthResponseDto> RegisterJointAccountAsync(JointAccountRegistrationDto jointAccountDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto> LoginJointAccountAsync(JointAccountLoginDto jointLoginDto);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);
    Task<bool> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto);
    Task<bool> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);
    Task<bool> LinkAccountAsync(string primaryUserId, string secondaryUserId);
    Task<bool> UnlinkAccountAsync(string userId);
    Task<bool> VerifyEmailAsync(string userId, string token);
    Task<bool> ResendEmailVerificationAsync(string email);
    Task<bool> LogoutAsync(string userId);
    Task<UserProfileDto> GetUserProfileAsync(string userId);
    Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateUserProfileDto updateDto);
    Task<List<ApplicationUser>> SearchUsersAsync(string query, int page = 1, int limit = 20);
}





