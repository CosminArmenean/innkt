using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.NeuroSpark.Services;
using innkt.Common.Models;
using System.Security.Claims;

namespace innkt.NeuroSpark.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BackgroundRemovalController : ControllerBase
    {
        private readonly ILogger<BackgroundRemovalController> _logger;
        private readonly IBackgroundRemovalService _backgroundRemovalService;

        public BackgroundRemovalController(
            ILogger<BackgroundRemovalController> logger,
            IBackgroundRemovalService backgroundRemovalService)
        {
            _logger = logger;
            _backgroundRemovalService = backgroundRemovalService;
        }

        /// <summary>
        /// Remove background from an uploaded image
        /// </summary>
        [HttpPost("remove")]
        public async Task<ActionResult<ApiResponse<BackgroundRemovalResult>>> RemoveBackground([FromForm] BackgroundRemovalRequest request)
        {
            try
            {
                if (request.ImageFile == null || request.ImageFile.Length == 0)
                {
                    return BadRequest(new ApiResponse<BackgroundRemovalResult>
                    {
                        Success = false,
                        Message = "Image file is required"
                    });
                }

                var userId = GetUserId();
                byte[] imageData;
                
                using (var memoryStream = new MemoryStream())
                {
                    await request.ImageFile.CopyToAsync(memoryStream);
                    imageData = memoryStream.ToArray();
                }

                // Create options from request
                var options = new BackgroundRemovalOptions
                {
                    Model = request.Model ?? "u2net",
                    OutputFormat = request.OutputFormat ?? "PNG",
                    Quality = request.Quality ?? 95,
                    PreserveTransparency = request.PreserveTransparency ?? true,
                    MaxSize = request.MaxSize,
                    OptimizeForWeb = request.OptimizeForWeb ?? true
                };

                var result = await _backgroundRemovalService.RemoveBackgroundAsync(imageData, userId, options);

                return Ok(new ApiResponse<BackgroundRemovalResult>
                {
                    Success = result.Success,
                    Data = result,
                    Message = result.Success ? "Background removed successfully" : result.Error ?? "Background removal failed"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing background from image");
                return StatusCode(500, new ApiResponse<BackgroundRemovalResult>
                {
                    Success = false,
                    Message = "Background removal failed"
                });
            }
        }

        /// <summary>
        /// Remove background from image URL
        /// </summary>
        [HttpPost("remove/url")]
        public async Task<ActionResult<ApiResponse<BackgroundRemovalResult>>> RemoveBackgroundFromUrl([FromBody] BackgroundRemovalUrlRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.ImageUrl))
                {
                    return BadRequest(new ApiResponse<BackgroundRemovalResult>
                    {
                        Success = false,
                        Message = "Image URL is required"
                    });
                }

                var userId = GetUserId();
                
                // Create options from request
                var options = new BackgroundRemovalOptions
                {
                    Model = request.Model ?? "u2net",
                    OutputFormat = request.OutputFormat ?? "PNG",
                    Quality = request.Quality ?? 95,
                    PreserveTransparency = request.PreserveTransparency ?? true,
                    MaxSize = request.MaxSize,
                    OptimizeForWeb = request.OptimizeForWeb ?? true
                };

                var result = await _backgroundRemovalService.RemoveBackgroundFromUrlAsync(request.ImageUrl, userId, options);

                return Ok(new ApiResponse<BackgroundRemovalResult>
                {
                    Success = result.Success,
                    Data = result,
                    Message = result.Success ? "Background removed successfully" : result.Error ?? "Background removal failed"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing background from URL");
                return StatusCode(500, new ApiResponse<BackgroundRemovalResult>
                {
                    Success = false,
                    Message = "Background removal from URL failed"
                });
            }
        }

        /// <summary>
        /// Process avatar with background removal and optimization
        /// </summary>
        [HttpPost("avatar")]
        public async Task<ActionResult<ApiResponse<byte[]>>> ProcessAvatar([FromForm] AvatarProcessingRequest request)
        {
            try
            {
                if (request.ImageFile == null || request.ImageFile.Length == 0)
                {
                    return BadRequest(new ApiResponse<byte[]>
                    {
                        Success = false,
                        Message = "Image file is required"
                    });
                }

                var userId = GetUserId();
                byte[] imageData;
                
                using (var memoryStream = new MemoryStream())
                {
                    await request.ImageFile.CopyToAsync(memoryStream);
                    imageData = memoryStream.ToArray();
                }

                // Create avatar processing options
                var options = new AvatarProcessingOptions
                {
                    RemoveBackground = request.RemoveBackground ?? true,
                    ResizeTo = request.ResizeTo ?? 512,
                    Format = request.Format ?? "PNG",
                    Quality = request.Quality ?? 95,
                    AddBorder = request.AddBorder ?? true,
                    BorderColor = request.BorderColor ?? "#FFFFFF",
                    BorderWidth = request.BorderWidth ?? 4,
                    RoundCorners = request.RoundCorners ?? true,
                    CornerRadius = request.CornerRadius ?? 256
                };

                var processedImageData = await _backgroundRemovalService.ProcessAvatarAsync(imageData, userId, options);

                return Ok(new ApiResponse<byte[]>
                {
                    Success = true,
                    Data = processedImageData,
                    Message = "Avatar processed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing avatar");
                return StatusCode(500, new ApiResponse<byte[]>
                {
                    Success = false,
                    Message = "Avatar processing failed"
                });
            }
        }

        /// <summary>
        /// Batch remove background from multiple images
        /// </summary>
        [HttpPost("batch")]
        public async Task<ActionResult<ApiResponse<List<BackgroundRemovalResult>>>> BatchRemoveBackground([FromForm] BatchBackgroundRemovalRequest request)
        {
            try
            {
                if (request.ImageFiles == null || !request.ImageFiles.Any())
                {
                    return BadRequest(new ApiResponse<List<BackgroundRemovalResult>>
                    {
                        Success = false,
                        Message = "Image files are required"
                    });
                }

                var userId = GetUserId();
                var backgroundRemovalRequests = new List<Services.BackgroundRemovalRequest>();

                foreach (var file in request.ImageFiles)
                {
                    using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);
                    
                    var options = new Services.BackgroundRemovalOptions
                    {
                        Model = request.Model ?? "u2net",
                        OutputFormat = request.OutputFormat ?? "PNG",
                        Quality = request.Quality ?? 95,
                        PreserveTransparency = request.PreserveTransparency ?? true,
                        MaxSize = request.MaxSize,
                        OptimizeForWeb = request.OptimizeForWeb ?? true
                    };

                    backgroundRemovalRequests.Add(new Services.BackgroundRemovalRequest
                    {
                        ImageData = memoryStream.ToArray(),
                        UserId = userId,
                        Options = options
                    });
                }

                var results = await _backgroundRemovalService.RemoveBackgroundBatchAsync(backgroundRemovalRequests);

                return Ok(new ApiResponse<List<BackgroundRemovalResult>>
                {
                    Success = true,
                    Data = results,
                    Message = $"Batch background removal completed for {results.Count} images"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch background removal");
                return StatusCode(500, new ApiResponse<List<BackgroundRemovalResult>>
                {
                    Success = false,
                    Message = "Batch background removal failed"
                });
            }
        }

        /// <summary>
        /// Get background removal model information
        /// </summary>
        [HttpGet("info")]
        public async Task<ActionResult<ApiResponse<BackgroundRemovalModelInfo>>> GetModelInfo()
        {
            try
            {
                var result = await _backgroundRemovalService.GetModelInfoAsync();

                return Ok(new ApiResponse<BackgroundRemovalModelInfo>
                {
                    Success = true,
                    Data = result,
                    Message = result.IsAvailable ? "Background removal models are available" : "Background removal models are not available"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting background removal model info");
                return StatusCode(500, new ApiResponse<BackgroundRemovalModelInfo>
                {
                    Success = false,
                    Message = "Failed to get background removal model information"
                });
            }
        }

        /// <summary>
        /// Check if background removal service is available
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<ApiResponse<bool>>> GetServiceStatus()
        {
            try
            {
                var isAvailable = await _backgroundRemovalService.IsServiceAvailableAsync();

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Data = isAvailable,
                    Message = isAvailable ? "Background removal service is available" : "Background removal service is not available"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking background removal service status");
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to check background removal service status"
                });
            }
        }

        /// <summary>
        /// Get processed image by path
        /// </summary>
        [HttpGet("image/{*imagePath}")]
        public async Task<IActionResult> GetProcessedImage(string imagePath)
        {
            try
            {
                var fullPath = Path.Combine("processed", "background_removed", imagePath);
                
                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound();
                }

                var imageBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
                var contentType = GetContentType(fullPath);

                return File(imageBytes, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error serving processed image: {imagePath}");
                return StatusCode(500);
            }
        }

        private string GetUserId()
        {
            return User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        }

        private string GetContentType(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return extension switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };
        }
    }

    // Request models
    public class BackgroundRemovalRequest
    {
        public IFormFile ImageFile { get; set; } = null!;
        public string? Model { get; set; }
        public string? OutputFormat { get; set; }
        public int? Quality { get; set; }
        public bool? PreserveTransparency { get; set; }
        public int? MaxSize { get; set; }
        public bool? OptimizeForWeb { get; set; }
    }

    public class BackgroundRemovalUrlRequest
    {
        public string ImageUrl { get; set; } = string.Empty;
        public string? Model { get; set; }
        public string? OutputFormat { get; set; }
        public int? Quality { get; set; }
        public bool? PreserveTransparency { get; set; }
        public int? MaxSize { get; set; }
        public bool? OptimizeForWeb { get; set; }
    }

    public class AvatarProcessingRequest
    {
        public IFormFile ImageFile { get; set; } = null!;
        public bool? RemoveBackground { get; set; }
        public int? ResizeTo { get; set; }
        public string? Format { get; set; }
        public int? Quality { get; set; }
        public bool? AddBorder { get; set; }
        public string? BorderColor { get; set; }
        public int? BorderWidth { get; set; }
        public bool? RoundCorners { get; set; }
        public int? CornerRadius { get; set; }
    }

    public class BatchBackgroundRemovalRequest
    {
        public List<IFormFile> ImageFiles { get; set; } = new();
        public string? Model { get; set; }
        public string? OutputFormat { get; set; }
        public int? Quality { get; set; }
        public bool? PreserveTransparency { get; set; }
        public int? MaxSize { get; set; }
        public bool? OptimizeForWeb { get; set; }
    }
}
