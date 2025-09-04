using innkt.Officer.Models.DTOs;

namespace innkt.Officer.Services;

public interface IUserVerificationService
{
    Task<UserVerificationResponseDto> SubmitVerificationRequestAsync(string userId, UserVerificationRequestDto request);
    Task<UserVerificationStatusDto> GetVerificationStatusAsync(string userId);
    Task<bool> ProcessCreditCardVerificationAsync(string userId, CreditCardVerificationDto creditCard);
    Task<bool> ProcessDriverLicenseVerificationAsync(string userId, DriverLicenseVerificationDto driverLicense);
    Task<bool> ApproveVerificationAsync(string userId, string verificationMethod);
    Task<bool> RejectVerificationAsync(string userId, string verificationMethod, string reason);
    Task<bool> IsUserVerifiedAsync(string userId);
    Task<string> GetVerificationMethodAsync(string userId);
    Task<bool> UpdateVerificationStatusAsync(string userId, string status, string? reason = null);
    Task<bool> StoreVerificationDocumentsAsync(string userId, string creditCardLastFour, string driverLicensePhotoUrl);
}



