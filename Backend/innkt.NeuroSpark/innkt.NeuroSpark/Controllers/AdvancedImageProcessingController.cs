using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;
using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdvancedImageProcessingController : ControllerBase
{
    private readonly IAdvancedImageProcessingService _advancedImageService;
    private readonly ILogger<AdvancedImageProcessingController> _logger;

    public AdvancedImageProcessingController(
        IAdvancedImageProcessingService advancedImageService,
        ILogger<AdvancedImageProcessingController> logger)
    {
        _advancedImageService = advancedImageService;
        _logger = logger;
    }

    [HttpPost("remove-background-advanced")]
    public async Task<IActionResult> RemoveBackgroundAdvanced(
        IFormFile image, 
        [FromForm] Models.BackgroundRemovalOptions options)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest(new { Error = "Image file is required" });
            }

            if (!IsValidImageFormat(image.ContentType))
            {
                return BadRequest(new { Error = "Invalid image format. Supported formats: PNG, JPEG, WebP" });
            }

            // Convert Models.BackgroundRemovalOptions to Services.BackgroundRemovalOptions
            var serviceOptions = new Services.BackgroundRemovalOptions
            {
                Model = options.Algorithm == "AI" ? "u2net" : "basic",
                OutputFormat = options.OutputFormat,
                Quality = options.Quality,
                PreserveTransparency = options.PreserveEdges,
                OptimizeForWeb = true
            };
            
            var result = await _advancedImageService.RemoveBackgroundAdvancedAsync(image, serviceOptions);
            
            if (result.Status == ProcessingStatus.Completed)
            {
                return Ok(result);
            }
            else
            {
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in advanced background removal");
            return StatusCode(500, new { Error = "Advanced background removal failed", Details = ex.Message });
        }
    }

    [HttpPost("enhance-advanced")]
    public async Task<IActionResult> EnhanceImageAdvanced(
        IFormFile image, 
        [FromForm] ImageEnhancementOptions options)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest(new { Error = "Image file is required" });
            }

            if (!IsValidImageFormat(image.ContentType))
            {
                return BadRequest(new { Error = "Invalid image format. Supported formats: PNG, JPEG, WebP" });
            }

            var result = await _advancedImageService.EnhanceImageAdvancedAsync(image, options);
            
            if (result.Status == ProcessingStatus.Completed)
            {
                return Ok(result);
            }
            else
            {
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in advanced image enhancement");
            return StatusCode(500, new { Error = "Advanced image enhancement failed", Details = ex.Message });
        }
    }

    [HttpPost("smart-face-crop")]
    public async Task<IActionResult> SmartFaceCrop(
        IFormFile image, 
        [FromForm] FaceCropOptions options)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest(new { Error = "Image file is required" });
            }

            if (!IsValidImageFormat(image.ContentType))
            {
                return BadRequest(new { Error = "Invalid image format. Supported formats: PNG, JPEG, WebP" });
            }

            var result = await _advancedImageService.SmartFaceCropAsync(image, options);
            
            if (result.Status == ProcessingStatus.Completed)
            {
                return Ok(result);
            }
            else
            {
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in smart face crop");
            return StatusCode(500, new { Error = "Smart face crop failed", Details = ex.Message });
        }
    }

    [HttpPost("batch-process")]
    public async Task<IActionResult> ProcessBatch(
        IFormFile[] images, 
        [FromForm] BatchProcessingOptions options)
    {
        try
        {
            if (images == null || images.Length == 0)
            {
                return BadRequest(new { Error = "At least one image file is required" });
            }

            if (images.Length > 20)
            {
                return BadRequest(new { Error = "Maximum 20 images allowed per batch" });
            }

            foreach (var image in images)
            {
                if (!IsValidImageFormat(image.ContentType))
                {
                    return BadRequest(new { Error = $"Invalid image format for {image.FileName}. Supported formats: PNG, JPEG, WebP" });
                }
            }

            var result = await _advancedImageService.ProcessBatchAsync(images, options);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in batch processing");
            return StatusCode(500, new { Error = "Batch processing failed", Details = ex.Message });
        }
    }

    [HttpPost("apply-style")]
    public async Task<IActionResult> ApplyStyle(
        IFormFile image, 
        [FromForm] StyleTransferOptions options)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest(new { Error = "Image file is required" });
            }

            if (!IsValidImageFormat(image.ContentType))
            {
                return BadRequest(new { Error = "Invalid image format. Supported formats: PNG, JPEG, WebP" });
            }

            var result = await _advancedImageService.ApplyStyleAsync(image, options);
            
            if (result.Status == ProcessingStatus.Completed)
            {
                return Ok(result);
            }
            else
            {
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in style transfer");
            return StatusCode(500, new { Error = "Style transfer failed", Details = ex.Message });
        }
    }

    [HttpPost("assess-quality")]
    public async Task<IActionResult> AssessImageQuality(IFormFile image)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest(new { Error = "Image file is required" });
            }

            if (!IsValidImageFormat(image.ContentType))
            {
                return BadRequest(new { Error = "Invalid image format. Supported formats: PNG, JPEG, WebP" });
            }

            var result = await _advancedImageService.AssessImageQualityAsync(image);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in image quality assessment");
            return StatusCode(500, new { Error = "Image quality assessment failed", Details = ex.Message });
        }
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetProcessingStatistics()
    {
        try
        {
            var stats = await _advancedImageService.GetProcessingStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting processing statistics");
            return StatusCode(500, new { Error = "Failed to get processing statistics", Details = ex.Message });
        }
    }

    [HttpGet("available-styles")]
    public IActionResult GetAvailableStyles()
    {
        var styles = new[]
        {
            new { Name = "vintage", Description = "Vintage/retro style with warm tones and reduced saturation" },
            new { Name = "blackandwhite", Description = "Classic black and white conversion" },
            new { Name = "warm", Description = "Warm color palette with enhanced saturation" },
            new { Name = "cool", Description = "Cool color palette with blue undertones" }
        };

        return Ok(styles);
    }

    [HttpGet("processing-options")]
    public IActionResult GetProcessingOptions()
    {
        var options = new
        {
            BackgroundRemoval = new
            {
                EdgeDetection = "Enable/disable edge detection for background removal",
                ColorAnalysis = "Enable/disable color analysis for background removal",
                Sensitivity = "Background removal sensitivity (0.1 - 1.0)",
                PreserveShadows = "Preserve shadow details during background removal"
            },
            Enhancement = new
            {
                Sharpness = "Enable/disable image sharpening",
                Contrast = "Enable/disable contrast enhancement",
                Colors = "Enable/disable color enhancement",
                NoiseReduction = "Enable/disable noise reduction",
                EnhancementStrength = "Enhancement intensity (0.1 - 1.0)",
                AutoAdjust = "Automatic image adjustment"
            },
            FaceCrop = new
            {
                TargetSize = "Output image size (256, 512, 1024)",
                FaceDetectionThreshold = "Face detection confidence (0.1 - 1.0)",
                CenterOnFace = "Center crop on detected face",
                MaintainAspectRatio = "Maintain original aspect ratio"
            }
        };

        return Ok(options);
    }

    private bool IsValidImageFormat(string contentType)
    {
        var validFormats = new[]
        {
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp"
        };

        return validFormats.Contains(contentType.ToLower());
    }
}
