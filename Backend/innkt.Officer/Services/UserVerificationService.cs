using System.Security.Cryptography;
using System.Text;
using innkt.Officer.Data;
using innkt.Officer.Models;
using innkt.Officer.Models.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace innkt.Officer.Services;

public class UserVerificationService : IUserVerificationService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<UserVerificationService> _logger;

    public UserVerificationService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<UserVerificationService> logger)
    {
        _userManager = userManager;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<UserVerificationResponseDto> SubmitVerificationRequestAsync(string userId, UserVerificationRequestDto request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        // Check if user already has a pending verification
        if (user.VerificationStatus == "pending")
        {
            return new UserVerificationResponseDto
            {
                Success = false,
                Message = "User already has a pending verification request",
                VerificationId = string.Empty,
                RequestedAt = DateTime.UtcNow,
                Status = "already_pending"
            };
        }

        // Generate verification ID
        var verificationId = GenerateVerificationId();
        
        // Set initial verification status
        user.VerificationStatus = "pending";
        user.VerificationMethod = DetermineVerificationMethod(request);

        // Process verification documents
        bool creditCardProcessed = false;
        bool driverLicenseProcessed = false;

        if (request.CreditCard != null)
        {
            creditCardProcessed = await ProcessCreditCardVerificationAsync(userId, request.CreditCard);
        }

        if (request.DriverLicense != null)
        {
            driverLicenseProcessed = await ProcessDriverLicenseVerificationAsync(userId, request.DriverLicense);
        }

        // Update user verification status
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            _logger.LogError("Failed to update user verification status for user {UserId}: {Errors}", 
                userId, string.Join(", ", result.Errors.Select(e => e.Description)));
            
            return new UserVerificationResponseDto
            {
                Success = false,
                Message = "Failed to submit verification request",
                VerificationId = string.Empty,
                RequestedAt = DateTime.UtcNow,
                Status = "failed"
            };
        }

        _logger.LogInformation("Verification request submitted for user {UserId} with ID {VerificationId}", 
            userId, verificationId);

        return new UserVerificationResponseDto
        {
            Success = true,
            Message = "Verification request submitted successfully",
            VerificationId = verificationId,
            RequestedAt = DateTime.UtcNow,
            Status = "pending"
        };
    }

    public async Task<UserVerificationStatusDto> GetVerificationStatusAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        return new UserVerificationStatusDto
        {
            IsVerified = user.IsIdentityVerified,
            VerificationStatus = user.VerificationStatus ?? "not_submitted",
            VerificationMethod = user.VerificationMethod ?? string.Empty,
            VerifiedAt = user.IdentityVerifiedAt,
            RejectionReason = user.VerificationRejectionReason,
            CreditCardLastFour = user.CreditCardLastFour,
            DriverLicensePhotoUrl = user.DriverLicensePhotoUrl
        };
    }

    public async Task<bool> ProcessCreditCardVerificationAsync(string userId, CreditCardVerificationDto creditCard)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found", nameof(userId));
            }

            // Validate credit card number using Luhn algorithm
            if (!ValidateCreditCardNumber(creditCard.CardNumber))
            {
                _logger.LogWarning("Invalid credit card number for user {UserId}", userId);
                return false;
            }

            // Store only the last 4 digits for security
            user.CreditCardLastFour = creditCard.CardNumber.Substring(creditCard.CardNumber.Length - 4);
            
            // In a real application, you would:
            // 1. Validate the card with a payment processor (without charging)
            // 2. Verify the cardholder name matches the user
            // 3. Check for any fraud indicators
            // 4. Store encrypted card information if needed

            _logger.LogInformation("Credit card verification processed for user {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing credit card verification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> ProcessDriverLicenseVerificationAsync(string userId, DriverLicenseVerificationDto driverLicense)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found", nameof(userId));
            }

            // Store the driver's license photo URL
            user.DriverLicensePhotoUrl = driverLicense.PhotoUrl;

            // In a real application, you would:
            // 1. Validate the photo quality and readability
            // 2. Use OCR to extract license information
            // 3. Verify the information matches the user
            // 4. Check for any signs of tampering
            // 5. Store the photo securely

            _logger.LogInformation("Driver license verification processed for user {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing driver license verification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> ApproveVerificationAsync(string userId, string verificationMethod)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        // Approve the verification
        user.IsIdentityVerified = true;
        user.IdentityVerifiedAt = DateTime.UtcNow;
        user.VerificationStatus = "verified";
        user.VerificationRejectionReason = null;

        var result = await _userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            _logger.LogInformation("Verification approved for user {UserId} using method {Method}", 
                userId, verificationMethod);
            return true;
        }

        _logger.LogError("Failed to approve verification for user {UserId}: {Errors}", 
            userId, string.Join(", ", result.Errors.Select(e => e.Description)));
        return false;
    }

    public async Task<bool> RejectVerificationAsync(string userId, string verificationMethod, string reason)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        // Reject the verification
        user.IsIdentityVerified = false;
        user.IdentityVerifiedAt = null;
        user.VerificationStatus = "rejected";
        user.VerificationRejectionReason = reason;

        var result = await _userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            _logger.LogInformation("Verification rejected for user {UserId} using method {Method}. Reason: {Reason}", 
                userId, verificationMethod, reason);
            return true;
        }

        _logger.LogError("Failed to reject verification for user {UserId}: {Errors}", 
            userId, string.Join(", ", result.Errors.Select(e => e.Description)));
        return false;
    }

    public async Task<bool> IsUserVerifiedAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        return user.IsIdentityVerified;
    }

    public async Task<string> GetVerificationMethodAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        return user.VerificationMethod ?? string.Empty;
    }

    public async Task<bool> UpdateVerificationStatusAsync(string userId, string status, string? reason = null)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        user.VerificationStatus = status;
        if (reason != null)
        {
            user.VerificationRejectionReason = reason;
        }

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> StoreVerificationDocumentsAsync(string userId, string creditCardLastFour, string driverLicensePhotoUrl)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        user.CreditCardLastFour = creditCardLastFour;
        user.DriverLicensePhotoUrl = driverLicensePhotoUrl;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    private string DetermineVerificationMethod(UserVerificationRequestDto request)
    {
        if (request.CreditCard != null && request.DriverLicense != null)
        {
            return "both";
        }
        else if (request.CreditCard != null)
        {
            return "credit_card";
        }
        else if (request.DriverLicense != null)
        {
            return "driver_license";
        }
        
        return "unknown";
    }

    private string GenerateVerificationId()
    {
        // Generate a unique verification ID
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var random = RandomNumberGenerator.GetBytes(8);
        var randomString = Convert.ToBase64String(random).Replace("/", "_").Replace("+", "-").Substring(0, 8);
        
        return $"VER_{timestamp}_{randomString}";
    }

    private bool ValidateCreditCardNumber(string cardNumber)
    {
        // Remove spaces and dashes
        cardNumber = cardNumber.Replace(" ", "").Replace("-", "");
        
        // Check if it's a valid length (13-19 digits)
        if (cardNumber.Length < 13 || cardNumber.Length > 19)
        {
            return false;
        }

        // Check if it contains only digits
        if (!cardNumber.All(char.IsDigit))
        {
            return false;
        }

        // Luhn algorithm validation
        int sum = 0;
        bool alternate = false;
        
        for (int i = cardNumber.Length - 1; i >= 0; i--)
        {
            int digit = int.Parse(cardNumber[i].ToString());
            
            if (alternate)
            {
                digit *= 2;
                if (digit > 9)
                {
                    digit = (digit % 10) + 1;
                }
            }
            
            sum += digit;
            alternate = !alternate;
        }
        
        return sum % 10 == 0;
    }
}



