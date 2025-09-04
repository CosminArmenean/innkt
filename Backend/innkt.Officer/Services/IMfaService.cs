using innkt.Officer.Models.DTOs;

namespace innkt.Officer.Services;

public interface IMfaService
{
    Task<MfaStatusDto> GetMfaStatusAsync(string userId);
    Task<string> GenerateMfaSecretKeyAsync(string userId);
    Task<string> GenerateQrCodeUrlAsync(string userId, string secretKey);
    Task<bool> EnableMfaAsync(string userId, string secretKey, string verificationCode);
    Task<bool> DisableMfaAsync(string userId, string currentMfaCode);
    Task<bool> VerifyMfaCodeAsync(string userId, string mfaCode);
    Task<bool> IsMfaRequiredAsync(string userId);
    Task UpdateLastMfaVerificationAsync(string userId);
    Task<bool> ValidateMfaCodeAsync(string userId, string mfaCode);
    Task<string> GenerateBackupCodesAsync(string userId);
    Task<bool> ValidateBackupCodeAsync(string userId, string backupCode);
}



