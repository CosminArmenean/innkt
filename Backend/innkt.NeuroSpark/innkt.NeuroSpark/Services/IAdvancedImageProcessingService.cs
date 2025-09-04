using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Services;

public interface IAdvancedImageProcessingService
{
    /// <summary>
    /// Advanced background removal using edge detection and color analysis
    /// </summary>
    Task<ImageProcessingResult> RemoveBackgroundAdvancedAsync(IFormFile image, BackgroundRemovalOptions options);

    /// <summary>
    /// AI-like image enhancement with multiple algorithms
    /// </summary>
    Task<ImageProcessingResult> EnhanceImageAdvancedAsync(IFormFile image, ImageEnhancementOptions options);

    /// <summary>
    /// Smart face detection and cropping
    /// </summary>
    Task<ImageProcessingResult> SmartFaceCropAsync(IFormFile image, FaceCropOptions options);

    /// <summary>
    /// Batch image processing
    /// </summary>
    Task<BatchProcessingResult> ProcessBatchAsync(IFormFile[] images, BatchProcessingOptions options);

    /// <summary>
    /// Style transfer (basic implementation)
    /// </summary>
    Task<ImageProcessingResult> ApplyStyleAsync(IFormFile image, StyleTransferOptions options);

    /// <summary>
    /// Image quality assessment
    /// </summary>
    Task<ImageQualityResult> AssessImageQualityAsync(IFormFile image);

    /// <summary>
    /// Get processing statistics and performance metrics
    /// </summary>
    Task<ProcessingStatistics> GetProcessingStatisticsAsync();
}
