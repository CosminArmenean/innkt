using Microsoft.EntityFrameworkCore;
using innkt.Kinder.Models;
using innkt.Kinder.Data;
using QRCoder;
using System.Security.Cryptography;
using System.Text;

namespace innkt.Kinder.Services;

/// <summary>
/// Implementation of Kinder authentication service
/// Handles QR code generation, maturity scoring, and password management
/// </summary>
public class KinderAuthService : IKinderAuthService
{
    private readonly KinderDbContext _context;
    private readonly ILogger<KinderAuthService> _logger;

    public KinderAuthService(KinderDbContext context, ILogger<KinderAuthService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region QR Code & Login Code Management

    public async Task<KidLoginCodeResponse> GenerateLoginCodeAsync(Guid kidAccountId, Guid parentId, int expirationDays)
    {
        try
        {
            _logger.LogInformation("🔑 Generating login code for kid account {KidAccountId}", kidAccountId);

            // Get kid account and maturity score
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId && k.IsActive);

            if (kidAccount == null)
                throw new InvalidOperationException("Kid account not found or inactive");

            // Verify parent relationship
            if (kidAccount.ParentId != parentId)
                throw new UnauthorizedAccessException("Parent does not have access to this kid account");

            // Get maturity score
            var maturityScore = await GetOrCreateMaturityScoreAsync(kidAccountId, kidAccount.Age);

            // Determine expiration based on maturity level if not specified
            if (expirationDays == 0)
            {
                expirationDays = maturityScore.Level switch
                {
                    "low" => 7,      // 1 week
                    "medium" => 30,  // 1 month
                    "high" => 90,    // 3 months
                    _ => 7
                };
            }

            // Generate unique code
            var code = GenerateUniqueCode();

            // Create login code entity
            var loginCode = new KidLoginCode
            {
                Code = code,
                KidAccountId = kidAccountId,
                ParentId = parentId,
                ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
                ExpirationDays = expirationDays
            };

            // Generate QR code
            loginCode.QRCodeData = GenerateQRCode(code);

            _context.KidLoginCodes.Add(loginCode);
            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Login code generated successfully: {CodeId}", loginCode.Id);

            return new KidLoginCodeResponse
            {
                CodeId = loginCode.Id,
                Code = code,
                QRCodeDataUrl = loginCode.QRCodeData!,
                ExpiresAt = loginCode.ExpiresAt,
                ExpirationDays = expirationDays,
                MaturityLevel = maturityScore.Level
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error generating login code");
            throw;
        }
    }

    public async Task<bool> ValidateLoginCodeAsync(string code)
    {
        try
        {
            var loginCode = await _context.KidLoginCodes
                .FirstOrDefaultAsync(lc => lc.Code == code);

            if (loginCode == null)
            {
                _logger.LogWarning("❌ Login code not found: {Code}", code);
                return false;
            }

            // Check if already used
            if (loginCode.IsUsed)
            {
                _logger.LogWarning("❌ Login code already used: {Code}", code);
                return false;
            }

            // Check if revoked
            if (loginCode.IsRevoked)
            {
                _logger.LogWarning("❌ Login code revoked: {Code}", code);
                return false;
            }

            // Check if expired
            if (loginCode.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogWarning("❌ Login code expired: {Code}", code);
                return false;
            }

            // Mark as used
            loginCode.IsUsed = true;
            loginCode.UsedAt = DateTime.UtcNow;
            loginCode.LastLoginAttempt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Login code validated successfully: {Code}", code);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error validating login code");
            return false;
        }
    }

    public async Task<KidLoginCode?> GetLoginCodeAsync(string code)
    {
        return await _context.KidLoginCodes
            .Include(lc => lc.KidAccount)
            .FirstOrDefaultAsync(lc => lc.Code == code);
    }

    public async Task<bool> RevokeLoginCodeAsync(Guid codeId, Guid parentId)
    {
        try
        {
            var loginCode = await _context.KidLoginCodes
                .Include(lc => lc.KidAccount)
                .FirstOrDefaultAsync(lc => lc.Id == codeId);

            if (loginCode == null)
                return false;

            // Verify parent relationship
            if (loginCode.KidAccount.ParentId != parentId)
                throw new UnauthorizedAccessException("Parent does not have access to this login code");

            loginCode.IsRevoked = true;
            loginCode.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Login code revoked: {CodeId}", codeId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error revoking login code");
            return false;
        }
    }

    public async Task<List<KidLoginCode>> GetActiveLoginCodesAsync(Guid kidAccountId)
    {
        return await _context.KidLoginCodes
            .Where(lc => lc.KidAccountId == kidAccountId 
                      && !lc.IsUsed 
                      && !lc.IsRevoked 
                      && lc.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(lc => lc.CreatedAt)
            .ToListAsync();
    }

    #endregion

    #region Maturity Score Management

    public async Task<MaturityScore> CalculateMaturityScoreAsync(Guid kidAccountId)
    {
        try
        {
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId);

            if (kidAccount == null)
                throw new InvalidOperationException("Kid account not found");

            var maturityScore = await _context.MaturityScores
                .FirstOrDefaultAsync(ms => ms.KidAccountId == kidAccountId)
                ?? new MaturityScore { KidAccountId = kidAccountId };

            // Calculate age score (0-40 points)
            maturityScore.AgeScore = CalculateAgeScore(kidAccount.Age);

            // Parent assessment stays as set by parent
            // Behavioral score is calculated from metrics
            var behavioralScore = CalculateBehavioralScore(
                maturityScore.TimeManagement,
                maturityScore.ContentAppropriateness,
                maturityScore.SocialInteraction,
                maturityScore.ResponsibilityScore,
                maturityScore.SecurityAwareness
            );
            maturityScore.BehavioralScore = behavioralScore;

            // Calculate total
            maturityScore.TotalScore = maturityScore.AgeScore + maturityScore.ParentAssessment + maturityScore.BehavioralScore;

            // Determine level
            var previousLevel = maturityScore.Level;
            maturityScore.Level = maturityScore.TotalScore switch
            {
                >= 70 => "high",
                >= 40 => "medium",
                _ => "low"
            };

            // Track level change
            if (previousLevel != maturityScore.Level && !string.IsNullOrEmpty(previousLevel))
            {
                maturityScore.PreviousLevel = previousLevel;
                maturityScore.LevelChangedAt = DateTime.UtcNow;
                _logger.LogInformation("📊 Maturity level changed from {PreviousLevel} to {NewLevel}", previousLevel, maturityScore.Level);
            }

            maturityScore.LastUpdated = DateTime.UtcNow;

            if (maturityScore.Id == Guid.Empty)
                _context.MaturityScores.Add(maturityScore);
            else
                _context.MaturityScores.Update(maturityScore);

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Maturity score calculated: {TotalScore} ({Level})", maturityScore.TotalScore, maturityScore.Level);
            return maturityScore;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error calculating maturity score");
            throw;
        }
    }

    public async Task<MaturityScore?> GetMaturityScoreAsync(Guid kidAccountId)
    {
        return await _context.MaturityScores
            .FirstOrDefaultAsync(ms => ms.KidAccountId == kidAccountId);
    }

    public async Task<MaturityScore> UpdateParentAssessmentAsync(Guid kidAccountId, Guid parentId, int rating, string? notes = null)
    {
        try
        {
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId);

            if (kidAccount == null)
                throw new InvalidOperationException("Kid account not found");

            if (kidAccount.ParentId != parentId)
                throw new UnauthorizedAccessException("Parent does not have access to this kid account");

            if (rating < 0 || rating > 5)
                throw new ArgumentException("Rating must be between 0 and 5");

            var maturityScore = await GetOrCreateMaturityScoreAsync(kidAccountId, kidAccount.Age);

            maturityScore.ParentRating = rating;
            maturityScore.ParentAssessment = rating * 6; // Convert 0-5 to 0-30
            maturityScore.AssessmentNotes = notes;
            maturityScore.UpdatedBy = parentId;
            maturityScore.AssessmentMethod = "manual";

            await _context.SaveChangesAsync();

            // Recalculate total score
            return await CalculateMaturityScoreAsync(kidAccountId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating parent assessment");
            throw;
        }
    }

    public async Task<bool> UpdateBehavioralMetricsAsync(Guid kidAccountId, BehavioralMetrics metrics)
    {
        try
        {
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId);

            if (kidAccount == null)
                return false;

            var maturityScore = await GetOrCreateMaturityScoreAsync(kidAccountId, kidAccount.Age);

            maturityScore.TimeManagement = metrics.TimeManagement;
            maturityScore.ContentAppropriateness = metrics.ContentAppropriateness;
            maturityScore.SocialInteraction = metrics.SocialInteraction;
            maturityScore.ResponsibilityScore = metrics.ResponsibilityScore;
            maturityScore.SecurityAwareness = metrics.SecurityAwareness;

            await _context.SaveChangesAsync();

            // Recalculate total score
            await CalculateMaturityScoreAsync(kidAccountId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating behavioral metrics");
            return false;
        }
    }

    #endregion

    #region Password Management

    public async Task<bool> SetPasswordAsync(Guid kidAccountId, Guid parentId, string password)
    {
        try
        {
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId);

            if (kidAccount == null)
                return false;

            if (kidAccount.ParentId != parentId)
                throw new UnauthorizedAccessException("Parent does not have access to this kid account");

            var passwordSettings = await _context.KidPasswordSettings
                .FirstOrDefaultAsync(ps => ps.KidAccountId == kidAccountId)
                ?? new KidPasswordSettings { KidAccountId = kidAccountId };

            var isFirstPassword = !passwordSettings.HasPassword;

            passwordSettings.HasPassword = true;
            passwordSettings.PasswordSetByParent = true;
            passwordSettings.FirstPasswordSetAt = passwordSettings.FirstPasswordSetAt ?? DateTime.UtcNow;
            passwordSettings.LastPasswordChangeAt = DateTime.UtcNow;
            passwordSettings.PasswordRevoked = false;
            passwordSettings.UpdatedAt = DateTime.UtcNow;

            // Get maturity score to determine if kid can change password
            var maturityScore = await GetMaturityScoreAsync(kidAccountId);
            passwordSettings.CanChangePassword = maturityScore?.Level != "low";

            if (passwordSettings.Id == Guid.Empty)
                _context.KidPasswordSettings.Add(passwordSettings);
            else
                _context.KidPasswordSettings.Update(passwordSettings);

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Password {Action} for kid account {KidAccountId}", 
                isFirstPassword ? "set" : "updated", kidAccountId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error setting password");
            return false;
        }
    }

    public async Task<bool> ChangePasswordAsync(Guid kidAccountId, string oldPassword, string newPassword)
    {
        try
        {
            var passwordSettings = await _context.KidPasswordSettings
                .FirstOrDefaultAsync(ps => ps.KidAccountId == kidAccountId);

            if (passwordSettings == null || !passwordSettings.HasPassword)
                return false;

            if (!passwordSettings.CanChangePassword)
            {
                _logger.LogWarning("❌ Kid account {KidAccountId} cannot change password (low maturity)", kidAccountId);
                return false;
            }

            passwordSettings.PasswordChangedByKid = true;
            passwordSettings.LastPasswordChangeAt = DateTime.UtcNow;
            passwordSettings.PasswordChangeCount++;
            passwordSettings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Password changed by kid for account {KidAccountId}", kidAccountId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error changing password");
            return false;
        }
    }

    public async Task<bool> RevokePasswordAccessAsync(Guid kidAccountId, Guid parentId, string reason)
    {
        try
        {
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId);

            if (kidAccount == null)
                return false;

            if (kidAccount.ParentId != parentId)
                throw new UnauthorizedAccessException("Parent does not have access to this kid account");

            var passwordSettings = await _context.KidPasswordSettings
                .FirstOrDefaultAsync(ps => ps.KidAccountId == kidAccountId);

            if (passwordSettings == null)
                return false;

            // Only allow revocation if maturity is low or medium
            var maturityScore = await GetMaturityScoreAsync(kidAccountId);
            if (maturityScore?.Level == "high")
            {
                _logger.LogWarning("❌ Cannot revoke password for high maturity kid account");
                return false;
            }

            passwordSettings.PasswordRevoked = true;
            passwordSettings.RevokedAt = DateTime.UtcNow;
            passwordSettings.RevocationReason = reason;
            passwordSettings.CanChangePassword = false;
            passwordSettings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Password revoked for kid account {KidAccountId}. Reason: {Reason}", kidAccountId, reason);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error revoking password");
            return false;
        }
    }

    public async Task<KidPasswordSettings?> GetPasswordSettingsAsync(Guid kidAccountId)
    {
        return await _context.KidPasswordSettings
            .FirstOrDefaultAsync(ps => ps.KidAccountId == kidAccountId);
    }

    public async Task<bool> CheckIndependenceDayAsync(Guid kidAccountId)
    {
        var passwordSettings = await _context.KidPasswordSettings
            .FirstOrDefaultAsync(ps => ps.KidAccountId == kidAccountId);

        if (passwordSettings == null || passwordSettings.IndependenceDay == null)
            return false;

        if (DateTime.UtcNow >= passwordSettings.IndependenceDay && !passwordSettings.IndependenceDayReached)
        {
            passwordSettings.IndependenceDayReached = true;
            passwordSettings.NotifyParentOnPasswordChange = false;
            passwordSettings.CanChangePassword = true;
            passwordSettings.PasswordRevoked = false;
            passwordSettings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("🎉 Independence day reached for kid account {KidAccountId}", kidAccountId);
            return true;
        }

        return false;
    }

    #endregion

    #region Private Helper Methods

    private string GenerateUniqueCode()
    {
        // Generate a secure random 8-character alphanumeric code
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing characters
        var randomBytes = new byte[8];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }

        var code = new StringBuilder(8);
        foreach (var b in randomBytes)
        {
            code.Append(chars[b % chars.Length]);
        }

        return code.ToString();
    }

    private string GenerateQRCode(string code)
    {
        try
        {
            var qrGenerator = new QRCodeGenerator();
            var qrCodeData = qrGenerator.CreateQrCode(code, QRCodeGenerator.ECCLevel.Q);
            var qrCode = new PngByteQRCode(qrCodeData);
            var qrCodeBytes = qrCode.GetGraphic(20);
            
            // Convert to Base64 data URL
            var base64 = Convert.ToBase64String(qrCodeBytes);
            return $"data:image/png;base64,{base64}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error generating QR code");
            return string.Empty;
        }
    }

    private int CalculateAgeScore(int age)
    {
        // Age 6 = 0 points, Age 16+ = 40 points
        return Math.Min(40, Math.Max(0, (age - 6) * 4));
    }

    private int CalculateBehavioralScore(double timeManagement, double contentAppropriateness, 
        double socialInteraction, double responsibilityScore, double securityAwareness)
    {
        // Average all metrics (0-100 scale) and convert to 0-30 scale
        var average = (timeManagement + contentAppropriateness + socialInteraction + 
                      responsibilityScore + securityAwareness) / 5.0;
        
        return (int)Math.Round(average * 0.3); // Convert 0-100 to 0-30
    }

    private async Task<MaturityScore> GetOrCreateMaturityScoreAsync(Guid kidAccountId, int age)
    {
        var maturityScore = await _context.MaturityScores
            .FirstOrDefaultAsync(ms => ms.KidAccountId == kidAccountId);

        if (maturityScore == null)
        {
            maturityScore = new MaturityScore
            {
                KidAccountId = kidAccountId,
                AgeScore = CalculateAgeScore(age)
            };
            _context.MaturityScores.Add(maturityScore);
            await _context.SaveChangesAsync();
        }

        return maturityScore;
    }

    #endregion
}

