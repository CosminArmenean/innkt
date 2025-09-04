using System.Security.Cryptography;
using System.Text;
using innkt.Officer.Data;
using innkt.Officer.Models;
using innkt.Officer.Models.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace innkt.Officer.Services;

public class KidAccountService : IKidAccountService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<KidAccountService> _logger;

    public KidAccountService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<KidAccountService> logger)
    {
        _userManager = userManager;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> CreateKidAccountAsync(string parentUserId, CreateKidAccountDto request)
    {
        var parentUser = await _userManager.FindByIdAsync(parentUserId);
        if (parentUser == null)
        {
            throw new ArgumentException("Parent user not found", nameof(parentUserId));
        }

        // Check if parent user is verified (optional requirement)
        if (!parentUser.IsIdentityVerified)
        {
            _logger.LogWarning("Parent user {ParentUserId} is not verified, cannot create kid account", parentUserId);
            throw new InvalidOperationException("Parent user must be verified to create kid accounts");
        }

        // Create the kid account
        var kidUser = new ApplicationUser
        {
            UserName = $"kid_{Guid.NewGuid():N}",
            Email = $"kid_{Guid.NewGuid():N}@innkt.kid",
            FirstName = request.FirstName,
            LastName = request.LastName,
            BirthDate = request.BirthDate,
            Country = request.Country,
            Address = request.Address,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            IsKidAccount = true,
            ParentUserId = parentUserId,
            KidAccountCreatedAt = DateTime.UtcNow,
            KidAccountStatus = "active",
            IsActive = true,
            AcceptTerms = request.AcceptTerms,
            AcceptPrivacyPolicy = request.AcceptPrivacyPolicy,
            TermsAcceptedAt = request.AcceptTerms ? DateTime.UtcNow : null,
            PrivacyPolicyAcceptedAt = request.AcceptPrivacyPolicy ? DateTime.UtcNow : null,
            Language = parentUser.Language,
            Theme = parentUser.Theme
        };

        // Set independence date if provided
        if (request.IndependenceDate.HasValue)
        {
            kidUser.KidIndependenceDate = request.IndependenceDate.Value;
        }

        // Generate QR code and pairing code
        kidUser.KidQrCode = GenerateKidQrCode();
        kidUser.KidPairingCode = GenerateKidPairingCode();

        // Create the user without password (kid accounts don't have passwords)
        var result = await _userManager.CreateAsync(kidUser);
        if (!result.Succeeded)
        {
            _logger.LogError("Failed to create kid account for parent {ParentUserId}: {Errors}", 
                parentUserId, string.Join(", ", result.Errors.Select(e => e.Description)));
            throw new InvalidOperationException($"Failed to create kid account: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        _logger.LogInformation("Kid account created for parent {ParentUserId} with ID {KidUserId}", 
            parentUserId, kidUser.Id);

        return kidUser.Id;
    }

    public async Task<bool> PairKidAccountAsync(string kidAccountId, KidAccountPairingDto pairingRequest)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            throw new ArgumentException("Kid account not found", nameof(kidAccountId));
        }

        if (!kidUser.IsKidAccount)
        {
            throw new InvalidOperationException("User is not a kid account");
        }

        // Validate the pairing request
        if (kidUser.KidQrCode != pairingRequest.QrCode || 
            kidUser.KidPairingCode != pairingRequest.PairingCode)
        {
            _logger.LogWarning("Invalid pairing attempt for kid account {KidAccountId}", kidAccountId);
            return false;
        }

        // In a real application, you would:
        // 1. Store the device information
        // 2. Generate a new pairing code for security
        // 3. Log the pairing event
        // 4. Send notification to parent

        _logger.LogInformation("Kid account {KidAccountId} paired with device {DeviceId}", 
            kidAccountId, pairingRequest.DeviceId);

        return true;
    }

    public async Task<KidAccountStatusDto> GetKidAccountStatusAsync(string kidAccountId)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            throw new ArgumentException("Kid account not found", nameof(kidAccountId));
        }

        var parentUser = kidUser.ParentUserId != null ? await _userManager.FindByIdAsync(kidUser.ParentUserId) : null;

        return new KidAccountStatusDto
        {
            Id = kidUser.Id,
            FirstName = kidUser.FirstName,
            LastName = kidUser.LastName,
            FullName = kidUser.FullName,
            IsActive = kidUser.IsActive,
            Status = kidUser.KidAccountStatus ?? "unknown",
            IndependenceDate = kidUser.KidIndependenceDate,
            IsIndependent = kidUser.IsKidAccountIndependent,
            ProfilePictureUrl = kidUser.ProfilePictureUrl,
            CreatedAt = kidUser.CreatedAt,
            ParentUserId = kidUser.ParentUserId ?? string.Empty,
            ParentFullName = parentUser?.FullName ?? string.Empty
        };
    }

    public async Task<List<KidAccountStatusDto>> GetParentKidAccountsAsync(string parentUserId)
    {
        var kidAccounts = await _context.Users
            .Where(u => u.ParentUserId == parentUserId && u.IsKidAccount)
            .ToListAsync();

        var result = new List<KidAccountStatusDto>();
        foreach (var kidAccount in kidAccounts)
        {
            result.Add(new KidAccountStatusDto
            {
                Id = kidAccount.Id,
                FirstName = kidAccount.FirstName,
                LastName = kidAccount.LastName,
                FullName = kidAccount.FullName,
                IsActive = kidAccount.IsActive,
                Status = kidAccount.KidAccountStatus ?? "unknown",
                IndependenceDate = kidAccount.KidIndependenceDate,
                IsIndependent = kidAccount.IsKidAccountIndependent,
                ProfilePictureUrl = kidAccount.ProfilePictureUrl,
                CreatedAt = kidAccount.CreatedAt,
                ParentUserId = kidAccount.ParentUserId ?? string.Empty,
                ParentFullName = string.Empty // Will be filled by parent user
            });
        }

        return result;
    }

    public async Task<bool> SetKidIndependenceDateAsync(string kidAccountId, DateTime independenceDate)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            throw new ArgumentException("Kid account not found", nameof(kidAccountId));
        }

        if (!kidUser.IsKidAccount)
        {
            throw new InvalidOperationException("User is not a kid account");
        }

        // Set the independence date
        kidUser.KidIndependenceDate = independenceDate;
        kidUser.KidAccountStatus = "pending_independence";

        var result = await _userManager.UpdateAsync(kidUser);
        if (result.Succeeded)
        {
            _logger.LogInformation("Independence date set for kid account {KidAccountId}: {IndependenceDate}", 
                kidAccountId, independenceDate);
            return true;
        }

        _logger.LogError("Failed to set independence date for kid account {KidAccountId}: {Errors}", 
            kidAccountId, string.Join(", ", result.Errors.Select(e => e.Description)));
        return false;
    }

    public async Task<bool> MakeKidAccountIndependentAsync(string kidAccountId, KidAccountIndependenceDto request)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            throw new ArgumentException("Kid account not found", nameof(kidAccountId));
        }

        if (!kidUser.IsKidAccount)
        {
            throw new InvalidOperationException("User is not a kid account");
        }

        // Check if the kid account can become independent
        if (!kidUser.CanKidAccountBecomeIndependent)
        {
            throw new InvalidOperationException("Kid account cannot become independent yet");
        }

        // Set password for the now-independent account
        var token = await _userManager.GeneratePasswordResetTokenAsync(kidUser);
        var result = await _userManager.ResetPasswordAsync(kidUser, token, request.NewPassword);
        
        if (!result.Succeeded)
        {
            _logger.LogError("Failed to set password for independent kid account {KidAccountId}: {Errors}", 
                kidAccountId, string.Join(", ", result.Errors.Select(e => e.Description)));
            return false;
        }

        // Update account status
        kidUser.IsKidAccountIndependent = true;
        kidUser.KidAccountStatus = "independent";
        kidUser.IsKidAccount = false; // No longer a kid account
        kidUser.ParentUserId = null; // Remove parent relationship

        var updateResult = await _userManager.UpdateAsync(kidUser);
        if (updateResult.Succeeded)
        {
            _logger.LogInformation("Kid account {KidAccountId} is now independent", kidAccountId);
            return true;
        }

        _logger.LogError("Failed to update kid account status for {KidAccountId}: {Errors}", 
            kidAccountId, string.Join(", ", updateResult.Errors.Select(e => e.Description)));
        return false;
    }

    public async Task<bool> SubmitFollowRequestAsync(KidFollowRequestDto request)
    {
        var kidUser = await _userManager.FindByIdAsync(request.KidAccountId);
        if (kidUser == null)
        {
            throw new ArgumentException("Kid account not found", nameof(request.KidAccountId));
        }

        if (!kidUser.IsKidAccount)
        {
            throw new InvalidOperationException("User is not a kid account");
        }

        var targetUser = await _userManager.FindByIdAsync(request.TargetUserId);
        if (targetUser == null)
        {
            throw new ArgumentException("Target user not found", nameof(request.TargetUserId));
        }

        // In a real application, you would:
        // 1. Create a follow request record
        // 2. Send notification to parent for approval
        // 3. Store the request details
        // 4. Handle different types of follow requests

        _logger.LogInformation("Follow request submitted from kid account {KidAccountId} to user {TargetUserId}", 
            request.KidAccountId, request.TargetUserId);

        return true;
    }

    public async Task<bool> ApproveFollowRequestAsync(string parentUserId, KidFollowApprovalDto approval)
    {
        // In a real application, you would:
        // 1. Validate that the parent is authorized to approve
        // 2. Update the follow request status
        // 3. Create the follow relationship
        // 4. Send notifications

        _logger.LogInformation("Follow request {RequestId} approved by parent {ParentUserId}", 
            approval.FollowRequestId, parentUserId);

        return true;
    }

    public async Task<bool> RejectFollowRequestAsync(string parentUserId, KidFollowApprovalDto rejection)
    {
        // In a real application, you would:
        // 1. Validate that the parent is authorized to reject
        // 2. Update the follow request status
        // 3. Send rejection notification
        // 4. Log the rejection reason

        _logger.LogInformation("Follow request {RequestId} rejected by parent {ParentUserId}. Reason: {Reason}", 
            rejection.FollowRequestId, parentUserId, rejection.RejectionReason);

        return true;
    }

    public async Task<bool> IsKidAccountActiveAsync(string kidAccountId)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            return false;
        }

        return kidUser.IsKidAccountActive;
    }

    public async Task<bool> CanKidFollowUserAsync(string kidAccountId, string targetUserId)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null || !kidUser.IsKidAccount)
        {
            return false;
        }

        var targetUser = await _userManager.FindByIdAsync(targetUserId);
        if (targetUser == null)
        {
            return false;
        }

        // In a real application, you would check:
        // 1. If the target user is in a kid-friendly category
        // 2. If the target user allows kid followers
        // 3. If there are any restrictions based on content type
        // 4. If the parent has approved this specific follow

        // For now, return true as a placeholder
        return true;
    }

    public async Task<string> GenerateKidQrCodeAsync(string kidAccountId)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            throw new ArgumentException("Kid account not found", nameof(kidAccountId));
        }

        // Generate a new QR code
        var newQrCode = GenerateKidQrCode();
        kidUser.KidQrCode = newQrCode;

        var result = await _userManager.UpdateAsync(kidUser);
        if (result.Succeeded)
        {
            _logger.LogInformation("New QR code generated for kid account {KidAccountId}", kidAccountId);
            return newQrCode;
        }

        _logger.LogError("Failed to generate new QR code for kid account {KidAccountId}", kidAccountId);
        throw new InvalidOperationException("Failed to generate new QR code");
    }

    public async Task<string> GenerateKidPairingCodeAsync(string kidAccountId)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            throw new ArgumentException("Kid account not found", nameof(kidAccountId));
        }

        // Generate a new pairing code
        var newPairingCode = GenerateKidPairingCode();
        kidUser.KidPairingCode = newPairingCode;

        var result = await _userManager.UpdateAsync(kidUser);
        if (result.Succeeded)
        {
            _logger.LogInformation("New pairing code generated for kid account {KidAccountId}", kidAccountId);
            return newPairingCode;
        }

        _logger.LogError("Failed to generate new pairing code for kid account {KidAccountId}", kidAccountId);
        throw new InvalidOperationException("Failed to generate new pairing code");
    }

    public async Task<bool> ValidateKidPairingAsync(string kidAccountId, string qrCode, string pairingCode)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            return false;
        }

        return kidUser.KidQrCode == qrCode && kidUser.KidPairingCode == pairingCode;
    }

    public async Task<bool> DeactivateKidAccountAsync(string kidAccountId, string reason)
    {
        var kidUser = await _userManager.FindByIdAsync(kidAccountId);
        if (kidUser == null)
        {
            throw new ArgumentException("Kid account not found", nameof(kidAccountId));
        }

        // Deactivate the kid account
        kidUser.IsActive = false;
        kidUser.KidAccountStatus = "suspended";
        kidUser.LockReason = reason;

        var result = await _userManager.UpdateAsync(kidUser);
        if (result.Succeeded)
        {
            _logger.LogInformation("Kid account {KidAccountId} deactivated. Reason: {Reason}", kidAccountId, reason);
            return true;
        }

        _logger.LogError("Failed to deactivate kid account {KidAccountId}: {Errors}", 
            kidAccountId, string.Join(", ", result.Errors.Select(e => e.Description)));
        return false;
    }

    private string GenerateKidQrCode()
    {
        // Generate a unique QR code identifier
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var random = RandomNumberGenerator.GetBytes(16);
        var randomString = Convert.ToBase64String(random).Replace("/", "_").Replace("+", "-").Substring(0, 16);
        
        return $"KID_QR_{timestamp}_{randomString}";
    }

    private string GenerateKidPairingCode()
    {
        // Generate a 6-digit pairing code
        var random = new Random();
        return random.Next(100000, 999999).ToString();
    }
}



