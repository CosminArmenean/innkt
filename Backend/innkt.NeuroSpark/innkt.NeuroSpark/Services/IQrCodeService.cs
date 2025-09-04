using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Services;

public interface IQrCodeService
{
    /// <summary>
    /// Generate a QR code with custom data and styling
    /// </summary>
    Task<QrCodeResult> GenerateQrCodeAsync(QrCodeGenerationRequest request);

    /// <summary>
    /// Generate a QR code for kid account pairing
    /// </summary>
    Task<QrCodeResult> GenerateKidPairingQrCodeAsync(KidPairingQrRequest request);

    /// <summary>
    /// Scan a QR code from an image file
    /// </summary>
    Task<QrCodeScanResult> ScanQrCodeAsync(IFormFile qrCodeImage);

    /// <summary>
    /// Validate QR code data
    /// </summary>
    Task<QrCodeValidationResult> ValidateQrCodeAsync(QrCodeValidationRequest request);

    /// <summary>
    /// Generate a QR code for group invitations
    /// </summary>
    Task<QrCodeResult> GenerateGroupInvitationQrCodeAsync(string groupId, string invitationCode, DateTime expiresAt);

    /// <summary>
    /// Check if a QR code has expired
    /// </summary>
    Task<bool> IsQrCodeExpiredAsync(string qrCodeData);

    /// <summary>
    /// Get cached QR code URL
    /// </summary>
    Task<string?> GetCachedQrCodeUrlAsync(string fileName);

    /// <summary>
    /// Clear QR code cache for a specific file
    /// </summary>
    Task<bool> ClearQrCodeCacheAsync(string fileName);

    /// <summary>
    /// Get QR code cache statistics
    /// </summary>
    Task<Dictionary<string, object>> GetQrCodeCacheStatisticsAsync();
}
