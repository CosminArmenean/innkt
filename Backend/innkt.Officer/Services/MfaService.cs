using System.Security.Cryptography;
using System.Text;
using innkt.Officer.Data;
using innkt.Officer.Models;
using innkt.Officer.Models.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OtpNet;

namespace innkt.Officer.Services;

public class MfaService : IMfaService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MfaService> _logger;

    public MfaService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<MfaService> logger)
    {
        _userManager = userManager;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<MfaStatusDto> GetMfaStatusAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        return new MfaStatusDto
        {
            IsEnabled = user.IsMfaEnabled,
            LastVerification = user.LastMfaVerification,
            IsRequired = user.IsMfaRequired,
            SecretKey = user.IsMfaEnabled ? user.MfaSecretKey ?? string.Empty : string.Empty,
            QrCodeUrl = user.IsMfaEnabled ? await GenerateQrCodeUrlAsync(userId, user.MfaSecretKey ?? string.Empty) : string.Empty
        };
    }

    public async Task<string> GenerateMfaSecretKeyAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        // Generate a random 32-byte secret key
        var secretKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        
        // Store the secret key temporarily (will be confirmed when MFA is enabled)
        user.MfaSecretKey = secretKey;
        await _userManager.UpdateAsync(user);

        return secretKey;
    }

    public async Task<string> GenerateQrCodeUrlAsync(string userId, string secretKey)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        var issuer = _configuration["Jwt:Issuer"] ?? "INNKT";
        var accountName = user.Email ?? user.UserName ?? userId;
        
        // Generate TOTP URI for QR code
        var totpUri = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(accountName)}?secret={secretKey}&issuer={Uri.EscapeDataString(issuer)}&algorithm=SHA1&digits=6&period=30";
        
        // In a real application, you would generate an actual QR code image
        // For now, return the URI that can be used by frontend to generate QR code
        return totpUri;
    }

    public async Task<bool> EnableMfaAsync(string userId, string secretKey, string verificationCode)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        // Verify the provided code
        if (!ValidateTOTPCode(secretKey, verificationCode))
        {
            _logger.LogWarning("Invalid MFA verification code for user {UserId}", userId);
            return false;
        }

        // Enable MFA
        user.IsMfaEnabled = true;
        user.MfaSecretKey = secretKey;
        user.MfaEnabledAt = DateTime.UtcNow;
        user.LastMfaVerification = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            _logger.LogInformation("MFA enabled for user {UserId}", userId);
            return true;
        }

        _logger.LogError("Failed to enable MFA for user {UserId}: {Errors}", userId, string.Join(", ", result.Errors.Select(e => e.Description)));
        return false;
    }

    public async Task<bool> DisableMfaAsync(string userId, string currentMfaCode)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        if (!user.IsMfaEnabled)
        {
            return true; // Already disabled
        }

        // Verify the current MFA code
        if (!ValidateTOTPCode(user.MfaSecretKey ?? string.Empty, currentMfaCode))
        {
            _logger.LogWarning("Invalid MFA code when disabling MFA for user {UserId}", userId);
            return false;
        }

        // Disable MFA
        user.IsMfaEnabled = false;
        user.MfaSecretKey = null;
        user.MfaEnabledAt = null;
        user.LastMfaVerification = null;

        var result = await _userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            _logger.LogInformation("MFA disabled for user {UserId}", userId);
            return true;
        }

        _logger.LogError("Failed to disable MFA for user {UserId}: {Errors}", userId, string.Join(", ", result.Errors.Select(e => e.Description)));
        return false;
    }

    public async Task<bool> VerifyMfaCodeAsync(string userId, string mfaCode)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        if (!user.IsMfaEnabled)
        {
            return true; // MFA not required
        }

        var isValid = ValidateTOTPCode(user.MfaSecretKey ?? string.Empty, mfaCode);
        if (isValid)
        {
            // Update last verification time
            user.LastMfaVerification = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            
            _logger.LogInformation("MFA verification successful for user {UserId}", userId);
        }
        else
        {
            _logger.LogWarning("MFA verification failed for user {UserId}", userId);
        }

        return isValid;
    }

    public async Task<bool> IsMfaRequiredAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        return user.IsMfaRequired;
    }

    public async Task UpdateLastMfaVerificationAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        user.LastMfaVerification = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
    }

    public async Task<bool> ValidateMfaCodeAsync(string userId, string mfaCode)
    {
        return await VerifyMfaCodeAsync(userId, mfaCode);
    }

    public async Task<string> GenerateBackupCodesAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        // Generate 10 backup codes, each 8 characters long
        var backupCodes = new List<string>();
        for (int i = 0; i < 10; i++)
        {
            backupCodes.Add(GenerateRandomCode(8));
        }

        // In a real application, you would hash these codes and store them securely
        // For now, we'll return them as a comma-separated string
        var backupCodesString = string.Join(",", backupCodes);
        
        _logger.LogInformation("Generated backup codes for user {UserId}", userId);
        return backupCodesString;
    }

    public async Task<bool> ValidateBackupCodeAsync(string userId, string backupCode)
    {
        // In a real application, you would validate against stored hashed backup codes
        // For now, we'll implement a simple validation
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        // This is a placeholder implementation
        // In production, you would:
        // 1. Hash the provided backup code
        // 2. Check against stored hashed backup codes
        // 3. Remove used backup codes
        // 4. Update last verification time
        
        _logger.LogInformation("Backup code validation for user {UserId} (placeholder implementation)", userId);
        return true; // Placeholder
    }

    private bool ValidateTOTPCode(string secretKey, string code)
    {
        try
        {
            var totp = new Totp(Base32Encoding.ToBytes(secretKey));
            return totp.VerifyTotp(code, out _, new VerificationWindow(1, 1)); // Allow 1 period before and after
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating TOTP code");
            return false;
        }
    }

    private string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}



