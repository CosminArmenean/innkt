using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Services;

public interface IImageProcessingService
{
    /// <summary>
    /// Process profile picture with AI background removal and enhancement
    /// </summary>
    Task<ImageProcessingResult> ProcessProfilePictureAsync(IFormFile image);

    /// <summary>
    /// Remove background from image using AI
    /// </summary>
    Task<ImageProcessingResult> RemoveBackgroundAsync(IFormFile image);

    /// <summary>
    /// Enhance image quality using AI
    /// </summary>
    Task<ImageProcessingResult> EnhanceImageAsync(IFormFile image);

    /// <summary>
    /// Crop image to square format
    /// </summary>
    Task<ImageProcessingResult> CropToSquareAsync(IFormFile image, int targetSize = 512);

    /// <summary>
    /// Get processing status for a specific job
    /// </summary>
    Task<ImageProcessingResult> GetProcessingStatusAsync(string jobId);

    /// <summary>
    /// Get cached image URL
    /// </summary>
    Task<string?> GetCachedImageUrlAsync(string fileName);

    /// <summary>
    /// Clear image cache for a specific file
    /// </summary>
    Task<bool> ClearImageCacheAsync(string fileName);

    /// <summary>
    /// Get cache statistics
    /// </summary>
    Task<Dictionary<string, object>> GetCacheStatisticsAsync();
}
