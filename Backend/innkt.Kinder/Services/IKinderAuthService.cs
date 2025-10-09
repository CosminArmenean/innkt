using innkt.Kinder.Models;

namespace innkt.Kinder.Services;

/// <summary>
/// Kinder authentication service for QR code login and maturity-based password management
/// </summary>
public interface IKinderAuthService
{
    // QR Code & Login Code Management
    Task<KidLoginCodeResponse> GenerateLoginCodeAsync(Guid kidAccountId, Guid parentId, int expirationDays);
    Task<bool> ValidateLoginCodeAsync(string code);
    Task<KidLoginCode?> GetLoginCodeAsync(string code);
    Task<bool> RevokeLoginCodeAsync(Guid codeId, Guid parentId);
    Task<List<KidLoginCode>> GetActiveLoginCodesAsync(Guid kidAccountId);
    
    // Maturity Score Management
    Task<MaturityScore> CalculateMaturityScoreAsync(Guid kidAccountId);
    Task<MaturityScore?> GetMaturityScoreAsync(Guid kidAccountId);
    Task<MaturityScore> UpdateParentAssessmentAsync(Guid kidAccountId, Guid parentId, int rating, string? notes = null);
    Task<bool> UpdateBehavioralMetricsAsync(Guid kidAccountId, BehavioralMetrics metrics);
    
    // Password Management
    Task<bool> SetPasswordAsync(Guid kidAccountId, Guid parentId, string password);
    Task<bool> ChangePasswordAsync(Guid kidAccountId, string oldPassword, string newPassword);
    Task<bool> RevokePasswordAccessAsync(Guid kidAccountId, Guid parentId, string reason);
    Task<KidPasswordSettings?> GetPasswordSettingsAsync(Guid kidAccountId);
    Task<bool> CheckIndependenceDayAsync(Guid kidAccountId);
}

/// <summary>
/// Response for login code generation
/// </summary>
public class KidLoginCodeResponse
{
    public Guid CodeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string QRCodeDataUrl { get; set; } = string.Empty; // Base64 data URL
    public DateTime ExpiresAt { get; set; }
    public int ExpirationDays { get; set; }
    public string MaturityLevel { get; set; } = "low";
}

/// <summary>
/// Behavioral metrics for maturity calculation
/// </summary>
public class BehavioralMetrics
{
    public double TimeManagement { get; set; } = 50; // 0-100
    public double ContentAppropriateness { get; set; } = 50; // 0-100
    public double SocialInteraction { get; set; } = 50; // 0-100
    public double ResponsibilityScore { get; set; } = 50; // 0-100
    public double SecurityAwareness { get; set; } = 50; // 0-100
}

