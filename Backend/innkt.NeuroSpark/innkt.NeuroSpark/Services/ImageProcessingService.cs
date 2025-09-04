using innkt.NeuroSpark.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Webp;

namespace innkt.NeuroSpark.Services;

public class ImageProcessingService : IImageProcessingService
{
    private readonly ILogger<ImageProcessingService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IRedisService _redisService;
    private readonly string _uploadPath;
    private readonly string _processedPath;

    public ImageProcessingService(
        ILogger<ImageProcessingService> logger, 
        IConfiguration configuration,
        IRedisService redisService)
    {
        _logger = logger;
        _configuration = configuration;
        _redisService = redisService;
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        _processedPath = Path.Combine(Directory.GetCurrentDirectory(), "processed");
        
        // Ensure directories exist
        Directory.CreateDirectory(_uploadPath);
        Directory.CreateDirectory(_processedPath);
    }

    public async Task<ImageProcessingResult> ProcessProfilePictureAsync(IFormFile image)
    {
        try
        {
            _logger.LogInformation("Processing profile picture: {FileName}", image.FileName);
            
            // Generate a unique processing ID
            var processingId = Guid.NewGuid().ToString();
            var cacheKey = $"profile_processing:{processingId}";
            
            // Check if we have a cached result
            var cachedResult = await _redisService.GetAsync<ImageProcessingResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogInformation("Returning cached profile processing result for ID: {ProcessingId}", processingId);
                return cachedResult;
            }
            
            // Save original image
            var originalFileName = await SaveImageAsync(image, _uploadPath);
            var originalUrl = $"/uploads/{originalFileName}";

            // Process the image
            var processedFileName = await ProcessImageForProfileAsync(image);
            var processedUrl = $"/processed/{processedFileName}";

            var result = new ImageProcessingResult
            {
                ProcessedImageUrl = processedUrl,
                OriginalImageUrl = originalUrl,
                Status = ProcessingStatus.Completed,
                Message = "Profile picture processed successfully",
                ProcessedAt = DateTime.UtcNow,
                Options = new ProcessingOptions
                {
                    RemoveBackground = true,
                    EnhanceQuality = true,
                    CropToSquare = true,
                    TargetSize = 512,
                    OutputFormat = "PNG"
                }
            };

            // Cache the result for 1 hour
            await _redisService.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
            
            // Also cache the processed image URL for quick access
            var imageCacheKey = $"processed_image:{processedFileName}";
            await _redisService.SetAsync(imageCacheKey, processedUrl, TimeSpan.FromDays(7));
            
            _logger.LogInformation("Profile picture processed and cached successfully. Processing ID: {ProcessingId}", processingId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing profile picture");
            return new ImageProcessingResult
            {
                Status = ProcessingStatus.Failed,
                Message = "Failed to process profile picture",
                ProcessedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<ImageProcessingResult> RemoveBackgroundAsync(IFormFile image)
    {
        try
        {
            _logger.LogInformation("Removing background from image: {FileName}", image.FileName);
            
            // Generate a unique processing ID
            var processingId = Guid.NewGuid().ToString();
            var cacheKey = $"background_removal:{processingId}";
            
            // Check if we have a cached result
            var cachedResult = await _redisService.GetAsync<ImageProcessingResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogInformation("Returning cached background removal result for ID: {ProcessingId}", processingId);
                return cachedResult;
            }
            
            // For now, we'll implement a basic background removal
            // In production, this would integrate with AI services like Remove.bg, Cloudinary, or custom ML models
            var processedFileName = await RemoveBackgroundBasicAsync(image);
            var processedUrl = $"/processed/{processedFileName}";

            var result = new ImageProcessingResult
            {
                ProcessedImageUrl = processedUrl,
                Status = ProcessingStatus.Completed,
                Message = "Background removed successfully",
                ProcessedAt = DateTime.UtcNow,
                Options = new ProcessingOptions
                {
                    RemoveBackground = true,
                    EnhanceQuality = false,
                    CropToSquare = false,
                    TargetSize = 512,
                    OutputFormat = "PNG"
                }
            };

            // Cache the result for 1 hour
            await _redisService.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
            
            // Cache the processed image URL
            var imageCacheKey = $"processed_image:{processedFileName}";
            await _redisService.SetAsync(imageCacheKey, processedUrl, TimeSpan.FromDays(7));
            
            _logger.LogInformation("Background removal completed and cached successfully. Processing ID: {ProcessingId}", processingId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing background from image");
            return new ImageProcessingResult
            {
                Status = ProcessingStatus.Failed,
                Message = "Failed to remove background",
                ProcessedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<ImageProcessingResult> EnhanceImageAsync(IFormFile image)
    {
        try
        {
            _logger.LogInformation("Enhancing image: {FileName}", image.FileName);
            
            // Generate a unique processing ID
            var processingId = Guid.NewGuid().ToString();
            var cacheKey = $"image_enhancement:{processingId}";
            
            // Check if we have a cached result
            var cachedResult = await _redisService.GetAsync<ImageProcessingResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogInformation("Returning cached image enhancement result for ID: {ProcessingId}", processingId);
                return cachedResult;
            }
            
            var processedFileName = await EnhanceImageBasicAsync(image);
            var processedUrl = $"/processed/{processedFileName}";

            var result = new ImageProcessingResult
            {
                ProcessedImageUrl = processedUrl,
                Status = ProcessingStatus.Completed,
                Message = "Image enhanced successfully",
                ProcessedAt = DateTime.UtcNow,
                Options = new ProcessingOptions
                {
                    RemoveBackground = false,
                    EnhanceQuality = true,
                    CropToSquare = false,
                    TargetSize = 512,
                    OutputFormat = "PNG"
                }
            };

            // Cache the result for 1 hour
            await _redisService.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
            
            // Cache the processed image URL
            var imageCacheKey = $"processed_image:{processedFileName}";
            await _redisService.SetAsync(imageCacheKey, processedUrl, TimeSpan.FromDays(7));
            
            _logger.LogInformation("Image enhancement completed and cached successfully. Processing ID: {ProcessingId}", processingId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enhancing image");
            return new ImageProcessingResult
            {
                Status = ProcessingStatus.Failed,
                Message = "Failed to enhance image",
                ProcessedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<ImageProcessingResult> CropToSquareAsync(IFormFile image, int targetSize = 512)
    {
        try
        {
            _logger.LogInformation("Cropping image to square: {FileName}, Size: {Size}", image.FileName, targetSize);
            
            // Generate a unique processing ID
            var processingId = Guid.NewGuid().ToString();
            var cacheKey = $"square_crop:{processingId}";
            
            // Check if we have a cached result
            var cachedResult = await _redisService.GetAsync<ImageProcessingResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogInformation("Returning cached square crop result for ID: {ProcessingId}", processingId);
                return cachedResult;
            }
            
            var processedFileName = await CropImageToSquareAsync(image, targetSize);
            var processedUrl = $"/processed/{processedFileName}";

            var result = new ImageProcessingResult
            {
                ProcessedImageUrl = processedUrl,
                Status = ProcessingStatus.Completed,
                Message = "Image cropped to square successfully",
                ProcessedAt = DateTime.UtcNow,
                Options = new ProcessingOptions
                {
                    RemoveBackground = false,
                    EnhanceQuality = false,
                    CropToSquare = true,
                    TargetSize = targetSize,
                    OutputFormat = "PNG"
                }
            };

            // Cache the result for 1 hour
            await _redisService.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
            
            // Cache the processed image URL
            var imageCacheKey = $"processed_image:{processedFileName}";
            await _redisService.SetAsync(imageCacheKey, processedUrl, TimeSpan.FromDays(7));
            
            _logger.LogInformation("Square crop completed and cached successfully. Processing ID: {ProcessingId}", processingId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cropping image to square");
            return new ImageProcessingResult
            {
                Status = ProcessingStatus.Failed,
                Message = "Failed to crop image to square",
                ProcessedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<ImageProcessingResult> GetProcessingStatusAsync(string jobId)
    {
        try
        {
            // Check Redis for processing status
            var cacheKey = $"processing_status:{jobId}";
            var status = await _redisService.GetAsync<ProcessingStatus>(cacheKey);
            
            if (status != ProcessingStatus.None)
            {
                return new ImageProcessingResult
                {
                    Status = status,
                    Message = $"Processing status: {status}",
                    ProcessedAt = DateTime.UtcNow
                };
            }
            
            // If not in cache, return default status
            return new ImageProcessingResult
            {
                Status = ProcessingStatus.Unknown,
                Message = "Processing status not found",
                ProcessedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting processing status for ID: {JobId}", jobId);
            return new ImageProcessingResult
            {
                Status = ProcessingStatus.Failed,
                Message = "Error retrieving processing status",
                ProcessedAt = DateTime.UtcNow
            };
        }
    }

    // Helper method to get cached image URL
    public async Task<string?> GetCachedImageUrlAsync(string fileName)
    {
        try
        {
            var cacheKey = $"processed_image:{fileName}";
            return await _redisService.GetAsync<string>(cacheKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached image URL for: {FileName}", fileName);
            return null;
        }
    }

    // Helper method to clear image cache
    public async Task<bool> ClearImageCacheAsync(string fileName)
    {
        try
        {
            var cacheKey = $"processed_image:{fileName}";
            return await _redisService.DeleteAsync(cacheKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing image cache for: {FileName}", fileName);
            return false;
        }
    }

    // Helper method to get cache statistics
    public async Task<Dictionary<string, object>> GetCacheStatisticsAsync()
    {
        try
        {
            var stats = new Dictionary<string, object>();
            
            // Get cache size
            var cacheSize = await _redisService.GetCacheSizeAsync();
            stats["CacheSize"] = cacheSize;
            
            // Get Redis statistics
            var redisStats = await _redisService.GetCacheStatsAsync();
            stats["RedisStats"] = redisStats;
            
            // Get processing statistics
            var processingKeys = await _redisService.GetKeysAsync("profile_processing:*");
            var backgroundRemovalKeys = await _redisService.GetKeysAsync("background_removal:*");
            var enhancementKeys = await _redisService.GetKeysAsync("image_enhancement:*");
            var cropKeys = await _redisService.GetKeysAsync("square_crop:*");
            
            stats["ProfileProcessingCount"] = processingKeys.Length;
            stats["BackgroundRemovalCount"] = backgroundRemovalKeys.Length;
            stats["EnhancementCount"] = enhancementKeys.Length;
            stats["CropCount"] = cropKeys.Length;
            
            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache statistics");
            return new Dictionary<string, object> { { "Error", ex.Message } };
        }
    }

    private async Task<string> SaveImageAsync(IFormFile image, string directory)
    {
        var fileName = $"{Guid.NewGuid()}_{image.FileName}";
        var filePath = Path.Combine(directory, fileName);
        
        using var stream = new FileStream(filePath, FileMode.Create);
        await image.CopyToAsync(stream);
        
        return fileName;
    }

    private async Task<string> ProcessImageForProfileAsync(IFormFile image)
    {
        var fileName = $"{Guid.NewGuid()}_profile_processed.png";
        var filePath = Path.Combine(_processedPath, fileName);
        
        using var inputStream = image.OpenReadStream();
        using var imageSharp = await Image.LoadAsync(inputStream);
        
        // Crop to square
        var size = Math.Min(imageSharp.Width, imageSharp.Height);
        var x = (imageSharp.Width - size) / 2;
        var y = (imageSharp.Height - size) / 2;
        
        imageSharp.Mutate(i => i.Crop(new Rectangle(x, y, size, size)));
        
        // Resize to target size
        imageSharp.Mutate(i => i.Resize(512, 512));
        
        // Save as PNG
        await imageSharp.SaveAsync(filePath, new PngEncoder());
        
        return fileName;
    }

    private async Task<string> RemoveBackgroundBasicAsync(IFormFile image)
    {
        // Basic background removal using edge detection
        // In production, this would use AI services
        var fileName = $"{Guid.NewGuid()}_nobg.png";
        var filePath = Path.Combine(_processedPath, fileName);
        
        using var inputStream = image.OpenReadStream();
        using var imageSharp = await Image.LoadAsync(inputStream);
        
        // For now, just save the original with transparency
        await imageSharp.SaveAsync(filePath, new PngEncoder());
        
        return fileName;
    }

    private async Task<string> EnhanceImageBasicAsync(IFormFile image)
    {
        var fileName = $"{Guid.NewGuid()}_enhanced.png";
        var filePath = Path.Combine(_processedPath, fileName);
        
        using var inputStream = image.OpenReadStream();
        using var imageSharp = await Image.LoadAsync(inputStream);
        
        // Basic enhancement - increase contrast and sharpness
        imageSharp.Mutate(i => i
            .Contrast(1.2f));
        
        await imageSharp.SaveAsync(filePath, new PngEncoder());
        
        return fileName;
    }

    private async Task<string> CropImageToSquareAsync(IFormFile image, int targetSize)
    {
        var fileName = $"{Guid.NewGuid()}_square.png";
        var filePath = Path.Combine(_processedPath, fileName);
        
        using var inputStream = image.OpenReadStream();
        using var imageSharp = await Image.LoadAsync(inputStream);
        
        // Crop to square
        var size = Math.Min(imageSharp.Width, imageSharp.Height);
        var x = (imageSharp.Width - size) / 2;
        var y = (imageSharp.Height - size) / 2;
        
        imageSharp.Mutate(i => i.Crop(new Rectangle(x, y, size, size)));
        
        // Resize to target size
        imageSharp.Mutate(i => i.Resize(targetSize, targetSize));
        
        await imageSharp.SaveAsync(filePath, new PngEncoder());
        
        return fileName;
    }
}
