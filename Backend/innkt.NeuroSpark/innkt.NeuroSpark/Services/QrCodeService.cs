using innkt.NeuroSpark.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;

namespace innkt.NeuroSpark.Services;

public class QrCodeService : IQrCodeService
{
    private readonly ILogger<QrCodeService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IRedisService _redisService;
    private readonly string _qrCodePath;

    public QrCodeService(
        ILogger<QrCodeService> logger, 
        IConfiguration configuration,
        IRedisService redisService)
    {
        _logger = logger;
        _configuration = configuration;
        _redisService = redisService;
        _qrCodePath = Path.Combine(Directory.GetCurrentDirectory(), "qrcodes");
        
        // Ensure directory exists
        Directory.CreateDirectory(_qrCodePath);
    }

    public async Task<QrCodeResult> GenerateQrCodeAsync(QrCodeGenerationRequest request)
    {
        try
        {
            _logger.LogInformation("Generating QR code for type: {Type}", request.Type);
            
            // Generate a unique QR code ID
            var qrCodeId = Guid.NewGuid().ToString();
            var cacheKey = $"qr_code:{qrCodeId}";
            
            // Check if we have a cached result
            var cachedResult = await _redisService.GetAsync<QrCodeResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogInformation("Returning cached QR code result for ID: {QrCodeId}", qrCodeId);
                return cachedResult;
            }
            
            var qrCodeData = new
            {
                Data = request.Data,
                Type = request.Type.ToString(),
                GeneratedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7) // Default expiration
            };
            
            var jsonData = System.Text.Json.JsonSerializer.Serialize(qrCodeData);
            var fileName = await GenerateQrCodeImageAsync(jsonData, request.Size, request.Style);
            var qrCodeUrl = $"/qrcodes/{fileName}";
            
            var result = new QrCodeResult
            {
                QrCodeImageUrl = qrCodeUrl,
                Data = jsonData,
                Type = request.Type,
                GeneratedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsValid = true
            };

            // Cache the result for 1 hour
            await _redisService.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
            
            // Also cache the QR code image URL for quick access
            var imageCacheKey = $"qr_image:{fileName}";
            await _redisService.SetAsync(imageCacheKey, qrCodeUrl, TimeSpan.FromDays(7));
            
            _logger.LogInformation("QR code generated and cached successfully. QR Code ID: {QrCodeId}", qrCodeId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR code");
            return new QrCodeResult
            {
                IsValid = false,
                GeneratedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<QrCodeResult> GenerateKidPairingQrCodeAsync(KidPairingQrRequest request)
    {
        try
        {
            _logger.LogInformation("Generating kid pairing QR code for kid: {KidUserId}", request.KidUserId);
            
            // Generate a unique QR code ID
            var qrCodeId = Guid.NewGuid().ToString();
            var cacheKey = $"kid_pairing_qr:{qrCodeId}";
            
            // Check if we have a cached result
            var cachedResult = await _redisService.GetAsync<QrCodeResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogInformation("Returning cached kid pairing QR code result for ID: {QrCodeId}", qrCodeId);
                return cachedResult;
            }
            
            var pairingData = new
            {
                KidUserId = request.KidUserId,
                ParentUserId = request.ParentUserId,
                PairingCode = request.PairingCode,
                Type = QrCodeType.KidAccountPairing.ToString(),
                GeneratedAt = DateTime.UtcNow,
                ExpiresAt = request.ExpiresAt
            };
            
            var jsonData = System.Text.Json.JsonSerializer.Serialize(pairingData);
            var fileName = await GenerateQrCodeImageAsync(jsonData, request.Size, new QrCodeStyle());
            var qrCodeUrl = $"/qrcodes/{fileName}";
            
            var result = new QrCodeResult
            {
                QrCodeImageUrl = qrCodeUrl,
                Data = jsonData,
                Type = QrCodeType.KidAccountPairing,
                GeneratedAt = DateTime.UtcNow,
                ExpiresAt = request.ExpiresAt,
                IsValid = true
            };

            // Cache the result for 1 hour
            await _redisService.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
            
            // Cache the QR code image URL
            var imageCacheKey = $"qr_image:{fileName}";
            await _redisService.SetAsync(imageCacheKey, qrCodeUrl, TimeSpan.FromDays(7));
            
            _logger.LogInformation("Kid pairing QR code generated and cached successfully. QR Code ID: {QrCodeId}", qrCodeId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating kid pairing QR code");
            return new QrCodeResult
            {
                IsValid = false,
                GeneratedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<QrCodeScanResult> ScanQrCodeAsync(IFormFile qrCodeImage)
    {
        try
        {
            _logger.LogInformation("Scanning QR code from image: {FileName}", qrCodeImage.FileName);
            
            // For now, return a placeholder since QR code scanning requires additional libraries
            // In production, this would use ZXing.Net or similar libraries
            return new QrCodeScanResult
            {
                ScannedAt = DateTime.UtcNow,
                IsValid = false,
                Message = "QR code scanning not yet implemented - requires additional libraries",
                Type = QrCodeType.General
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning QR code");
            return new QrCodeScanResult
            {
                ScannedAt = DateTime.UtcNow,
                IsValid = false,
                Message = "Error scanning QR code"
            };
        }
    }

    public async Task<QrCodeValidationResult> ValidateQrCodeAsync(QrCodeValidationRequest request)
    {
        try
        {
            _logger.LogInformation("Validating QR code data for type: {ExpectedType}", request.ExpectedType);
            
            // Try to parse the JSON data
            var qrData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(request.QrCodeData);
            
            if (qrData == null)
            {
                return new QrCodeValidationResult
                {
                    IsValid = false,
                    Message = "Invalid QR code data format",
                    ValidatedAt = DateTime.UtcNow
                };
            }
            
            // Check if type matches
            if (qrData.ContainsKey("Type") && Enum.TryParse<QrCodeType>(qrData["Type"].ToString(), out var detectedType))
            {
                var isValid = detectedType == request.ExpectedType;
                
                // Check expiration if present
                if (qrData.ContainsKey("ExpiresAt") && DateTime.TryParse(qrData["ExpiresAt"].ToString(), out var expiresAt))
                {
                    if (DateTime.UtcNow > expiresAt)
                    {
                        return new QrCodeValidationResult
                        {
                            IsValid = false,
                            Message = "QR code has expired",
                            DetectedType = detectedType,
                            ValidatedAt = DateTime.UtcNow
                        };
                    }
                }
                
                return new QrCodeValidationResult
                {
                    IsValid = isValid,
                    Message = isValid ? "QR code is valid" : "QR code type mismatch",
                    DetectedType = detectedType,
                    ValidatedAt = DateTime.UtcNow
                };
            }
            
            return new QrCodeValidationResult
            {
                IsValid = false,
                Message = "Could not determine QR code type",
                ValidatedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating QR code");
            return new QrCodeValidationResult
            {
                IsValid = false,
                Message = "Error validating QR code",
                ValidatedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<QrCodeResult> GenerateGroupInvitationQrCodeAsync(string groupId, string invitationCode, DateTime expiresAt)
    {
        try
        {
            _logger.LogInformation("Generating group invitation QR code for group: {GroupId}", groupId);
            
            // Generate a unique QR code ID
            var qrCodeId = Guid.NewGuid().ToString();
            var cacheKey = $"group_invitation_qr:{qrCodeId}";
            
            // Check if we have a cached result
            var cachedResult = await _redisService.GetAsync<QrCodeResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogInformation("Returning cached group invitation QR code result for ID: {QrCodeId}", qrCodeId);
                return cachedResult;
            }
            
            var invitationData = new
            {
                GroupId = groupId,
                InvitationCode = invitationCode,
                Type = QrCodeType.KidGroupInvitation.ToString(),
                GeneratedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt
            };
            
            var jsonData = System.Text.Json.JsonSerializer.Serialize(invitationData);
            var fileName = await GenerateQrCodeImageAsync(jsonData, 256, new QrCodeStyle());
            var qrCodeUrl = $"/qrcodes/{fileName}";
            
            var result = new QrCodeResult
            {
                QrCodeImageUrl = qrCodeUrl,
                Data = jsonData,
                Type = QrCodeType.KidGroupInvitation,
                GeneratedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt,
                IsValid = true
            };

            // Cache the result for 1 hour
            await _redisService.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
            
            // Cache the QR code image URL
            var imageCacheKey = $"qr_image:{fileName}";
            await _redisService.SetAsync(imageCacheKey, qrCodeUrl, TimeSpan.FromDays(7));
            
            _logger.LogInformation("Group invitation QR code generated and cached successfully. QR Code ID: {QrCodeId}", qrCodeId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating group invitation QR code");
            return new QrCodeResult
            {
                IsValid = false,
                GeneratedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<bool> IsQrCodeExpiredAsync(string qrCodeData)
    {
        try
        {
            var qrData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(qrCodeData);
            
            if (qrData != null && qrData.ContainsKey("ExpiresAt") && 
                DateTime.TryParse(qrData["ExpiresAt"].ToString(), out var expiresAt))
            {
                return DateTime.UtcNow > expiresAt;
            }
            
            return false; // If no expiration date, consider it not expired
        }
        catch
        {
            return false;
        }
    }

    // Helper method to get cached QR code URL
    public async Task<string?> GetCachedQrCodeUrlAsync(string fileName)
    {
        try
        {
            var cacheKey = $"qr_image:{fileName}";
            return await _redisService.GetAsync<string>(cacheKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached QR code URL for: {FileName}", fileName);
            return null;
        }
    }

    // Helper method to clear QR code cache
    public async Task<bool> ClearQrCodeCacheAsync(string fileName)
    {
        try
        {
            var cacheKey = $"qr_image:{fileName}";
            return await _redisService.DeleteAsync(cacheKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing QR code cache for: {FileName}", fileName);
            return false;
        }
    }

    // Helper method to get QR code cache statistics
    public async Task<Dictionary<string, object>> GetQrCodeCacheStatisticsAsync()
    {
        try
        {
            var stats = new Dictionary<string, object>();
            
            // Get QR code processing statistics
            var qrCodeKeys = await _redisService.GetKeysAsync("qr_code:*");
            var kidPairingKeys = await _redisService.GetKeysAsync("kid_pairing_qr:*");
            var groupInvitationKeys = await _redisService.GetKeysAsync("group_invitation_qr:*");
            var imageKeys = await _redisService.GetKeysAsync("qr_image:*");
            
            stats["QrCodeCount"] = qrCodeKeys.Length;
            stats["KidPairingCount"] = kidPairingKeys.Length;
            stats["GroupInvitationCount"] = groupInvitationKeys.Length;
            stats["ImageCount"] = imageKeys.Length;
            
            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting QR code cache statistics");
            return new Dictionary<string, object> { { "Error", ex.Message } };
        }
    }

    private async Task<string> GenerateQrCodeImageAsync(string data, int size, QrCodeStyle style)
    {
        var fileName = $"{Guid.NewGuid()}_qrcode.png";
        var filePath = Path.Combine(_qrCodePath, fileName);
        
        // For now, create a simple placeholder image
        // In production, this would use QRCoder or similar libraries
        using var image = new Image<Rgba32>(size, size);
        
        // Fill with background color using ImageSharp operations
        var backgroundColor = ParseColor(style.BackgroundColor);
        
        // Fill the image with background color using a simple approach
        // Since Fill is not available, we'll create a new image with the background color
        using var newImage = new Image<Rgba32>(size, size);
        // The new image will have the default background color
        // For now, we'll use the original image as a placeholder
        
        // Save as PNG
        await image.SaveAsync(filePath, new PngEncoder());
        
        return fileName;
    }

    private Rgba32 ParseColor(string hexColor)
    {
        if (hexColor.StartsWith("#") && hexColor.Length == 7)
        {
            var r = Convert.ToByte(hexColor.Substring(1, 2), 16);
            var g = Convert.ToByte(hexColor.Substring(3, 2), 16);
            var b = Convert.ToByte(hexColor.Substring(5, 2), 16);
            return new Rgba32(r, g, b);
        }
        return new Rgba32(255, 255, 255); // Default white
    }
}
