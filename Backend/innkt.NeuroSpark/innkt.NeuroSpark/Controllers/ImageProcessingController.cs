using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;
using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageProcessingController : ControllerBase
{
    private readonly IImageProcessingService _imageProcessingService;
    private readonly ILogger<ImageProcessingController> _logger;

    public ImageProcessingController(IImageProcessingService imageProcessingService, ILogger<ImageProcessingController> logger)
    {
        _imageProcessingService = imageProcessingService;
        _logger = logger;
    }

    /// <summary>
    /// Process profile picture with AI background removal and enhancement
    /// </summary>
    [HttpPost("profile-picture")]
    public async Task<ActionResult<ImageProcessingResult>> ProcessProfilePicture(IFormFile image)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest("No image file provided");
            }

            if (!IsValidImageFormat(image.ContentType))
            {
                return BadRequest("Invalid image format. Only PNG, JPEG, and WebP are supported.");
            }

            var result = await _imageProcessingService.ProcessProfilePictureAsync(image);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing profile picture");
            return StatusCode(500, "An error occurred while processing the image");
        }
    }

    /// <summary>
    /// Remove background from image using AI
    /// </summary>
    [HttpPost("remove-background")]
    public async Task<ActionResult<ImageProcessingResult>> RemoveBackground(IFormFile image)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest("No image file provided");
            }

            var result = await _imageProcessingService.RemoveBackgroundAsync(image);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing background from image");
            return StatusCode(500, "An error occurred while removing the background");
        }
    }

    /// <summary>
    /// Enhance image quality using AI
    /// </summary>
    [HttpPost("enhance")]
    public async Task<ActionResult<ImageProcessingResult>> EnhanceImage(IFormFile image)
    {
        try
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest("No image file provided");
            }

            var result = await _imageProcessingService.EnhanceImageAsync(image);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enhancing image");
            return StatusCode(500, "An error occurred while enhancing the image");
        }
    }

    private bool IsValidImageFormat(string contentType)
    {
        return contentType switch
        {
            "image/png" => true,
            "image/jpeg" => true,
            "image/webp" => true,
            _ => false
        };
    }
}



