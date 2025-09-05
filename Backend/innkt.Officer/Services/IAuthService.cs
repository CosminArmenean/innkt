using innkt.Officer.Models.DTOs;

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
}





