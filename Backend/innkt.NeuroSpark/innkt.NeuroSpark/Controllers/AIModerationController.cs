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
    public class AIModerationController : ControllerBase
    {
        private readonly ILogger<AIModerationController> _logger;
        private readonly IAIModerationService _aiModerationService;
        private readonly INudeNetModerationService _nudeNetService;

        public AIModerationController(
            ILogger<AIModerationController> logger,
            IAIModerationService aiModerationService,
            INudeNetModerationService nudeNetService)
        {
            _logger = logger;
            _aiModerationService = aiModerationService;
            _nudeNetService = nudeNetService;
        }

        /// <summary>
        /// Moderate text content for inappropriate content, spam, and compliance
        /// </summary>
        [HttpPost("text")]
        public async Task<ActionResult<ApiResponse<ContentModerationResult>>> ModerateText([FromBody] TextModerationRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new ApiResponse<ContentModerationResult>
                    {
                        Success = false,
                        Message = "Text content is required"
                    });
                }

                var userId = GetUserId();
                var result = await _aiModerationService.ModerateTextAsync(request.Text, userId);

                return Ok(new ApiResponse<ContentModerationResult>
                {
                    Success = true,
                    Data = result,
                    Message = result.IsApproved ? "Content approved" : "Content flagged for review"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moderating text content");
                return StatusCode(500, new ApiResponse<ContentModerationResult>
                {
                    Success = false,
                    Message = "Text moderation failed"
                });
            }
        }

        /// <summary>
        /// Moderate image content using AI and NudeNet
        /// </summary>
        [HttpPost("image")]
        public async Task<ActionResult<ApiResponse<ImageModerationResult>>> ModerateImage([FromForm] ImageModerationRequest request)
        {
            try
            {
                if (request.ImageFile == null || request.ImageFile.Length == 0)
                {
                    return BadRequest(new ApiResponse<ImageModerationResult>
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

                // Perform AI moderation
                var aiResult = await _aiModerationService.ModerateImageAsync(imageData, userId);
                
                // Perform NudeNet analysis as extra security layer
                var nudeNetResult = await _nudeNetService.AnalyzeImageAsync(imageData, userId);
                
                // Combine results
                var combinedResult = CombineImageModerationResults(aiResult, nudeNetResult);

                return Ok(new ApiResponse<ImageModerationResult>
                {
                    Success = true,
                    Data = combinedResult,
                    Message = combinedResult.IsApproved ? "Image approved" : "Image flagged for review"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moderating image content");
                return StatusCode(500, new ApiResponse<ImageModerationResult>
                {
                    Success = false,
                    Message = "Image moderation failed"
                });
            }
        }

        /// <summary>
        /// Moderate image from URL
        /// </summary>
        [HttpPost("image/url")]
        public async Task<ActionResult<ApiResponse<ImageModerationResult>>> ModerateImageFromUrl([FromBody] ImageUrlModerationRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.ImageUrl))
                {
                    return BadRequest(new ApiResponse<ImageModerationResult>
                    {
                        Success = false,
                        Message = "Image URL is required"
                    });
                }

                var userId = GetUserId();
                
                // Perform NudeNet analysis from URL
                var nudeNetResult = await _nudeNetService.AnalyzeImageFromUrlAsync(request.ImageUrl, userId);
                
                // Convert NudeNet result to ImageModerationResult
                var result = new ImageModerationResult
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsApproved = !nudeNetResult.IsNSFW,
                    Confidence = nudeNetResult.Confidence,
                    Violations = nudeNetResult.IsNSFW ? new List<ModerationViolation>
                    {
                        new ModerationViolation
                        {
                            Type = ViolationType.InappropriateImage,
                            Severity = ViolationSeverity.High,
                            Description = "Image contains NSFW content detected by NudeNet",
                            Confidence = nudeNetResult.Confidence,
                            SuggestedAction = ModerationAction.Block
                        }
                    } : new List<ModerationViolation>(),
                    Error = nudeNetResult.Error
                };

                return Ok(new ApiResponse<ImageModerationResult>
                {
                    Success = true,
                    Data = result,
                    Message = result.IsApproved ? "Image approved" : "Image flagged for review"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moderating image from URL");
                return StatusCode(500, new ApiResponse<ImageModerationResult>
                {
                    Success = false,
                    Message = "Image URL moderation failed"
                });
            }
        }

        /// <summary>
        /// Analyze sentiment of text content
        /// </summary>
        [HttpPost("sentiment")]
        public async Task<ActionResult<ApiResponse<SentimentAnalysisResult>>> AnalyzeSentiment([FromBody] SentimentAnalysisRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new ApiResponse<SentimentAnalysisResult>
                    {
                        Success = false,
                        Message = "Text content is required"
                    });
                }

                var result = await _aiModerationService.AnalyzeSentimentAsync(request.Text);

                return Ok(new ApiResponse<SentimentAnalysisResult>
                {
                    Success = true,
                    Data = result,
                    Message = $"Sentiment analysis completed: {result.Label}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing sentiment");
                return StatusCode(500, new ApiResponse<SentimentAnalysisResult>
                {
                    Success = false,
                    Message = "Sentiment analysis failed"
                });
            }
        }

        /// <summary>
        /// Detect spam in text content
        /// </summary>
        [HttpPost("spam")]
        public async Task<ActionResult<ApiResponse<SpamDetectionResult>>> DetectSpam([FromBody] SpamDetectionRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new ApiResponse<SpamDetectionResult>
                    {
                        Success = false,
                        Message = "Text content is required"
                    });
                }

                var userId = GetUserId();
                var result = await _aiModerationService.DetectSpamAsync(request.Text, userId);

                return Ok(new ApiResponse<SpamDetectionResult>
                {
                    Success = true,
                    Data = result,
                    Message = result.IsSpam ? "Spam detected" : "No spam detected"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting spam");
                return StatusCode(500, new ApiResponse<SpamDetectionResult>
                {
                    Success = false,
                    Message = "Spam detection failed"
                });
            }
        }

        /// <summary>
        /// Get content suggestions for improvement
        /// </summary>
        [HttpPost("suggestions")]
        public async Task<ActionResult<ApiResponse<ContentSuggestionResult>>> GetContentSuggestions([FromBody] ContentSuggestionRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new ApiResponse<ContentSuggestionResult>
                    {
                        Success = false,
                        Message = "Text content is required"
                    });
                }

                var userId = GetUserId();
                var result = await _aiModerationService.GetContentSuggestionsAsync(request.Text, userId);

                return Ok(new ApiResponse<ContentSuggestionResult>
                {
                    Success = true,
                    Data = result,
                    Message = $"Generated {result.Suggestions.Count} suggestions"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting content suggestions");
                return StatusCode(500, new ApiResponse<ContentSuggestionResult>
                {
                    Success = false,
                    Message = "Content suggestions failed"
                });
            }
        }

        /// <summary>
        /// Get hashtag suggestions for content
        /// </summary>
        [HttpPost("hashtags")]
        public async Task<ActionResult<ApiResponse<HashtagSuggestionResult>>> GetHashtagSuggestions([FromBody] HashtagSuggestionRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new ApiResponse<HashtagSuggestionResult>
                    {
                        Success = false,
                        Message = "Text content is required"
                    });
                }

                var result = await _aiModerationService.GetHashtagSuggestionsAsync(request.Text);

                return Ok(new ApiResponse<HashtagSuggestionResult>
                {
                    Success = true,
                    Data = result,
                    Message = $"Generated {result.SuggestedHashtags.Count} hashtag suggestions"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting hashtag suggestions");
                return StatusCode(500, new ApiResponse<HashtagSuggestionResult>
                {
                    Success = false,
                    Message = "Hashtag suggestions failed"
                });
            }
        }

        /// <summary>
        /// Analyze content quality
        /// </summary>
        [HttpPost("quality")]
        public async Task<ActionResult<ApiResponse<ContentQualityResult>>> AnalyzeContentQuality([FromBody] ContentQualityRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new ApiResponse<ContentQualityResult>
                    {
                        Success = false,
                        Message = "Text content is required"
                    });
                }

                var result = await _aiModerationService.AnalyzeContentQualityAsync(request.Text);

                return Ok(new ApiResponse<ContentQualityResult>
                {
                    Success = true,
                    Data = result,
                    Message = $"Content quality analysis completed: {result.OverallRating}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing content quality");
                return StatusCode(500, new ApiResponse<ContentQualityResult>
                {
                    Success = false,
                    Message = "Content quality analysis failed"
                });
            }
        }

        /// <summary>
        /// Check content compliance
        /// </summary>
        [HttpPost("compliance")]
        public async Task<ActionResult<ApiResponse<ComplianceResult>>> CheckCompliance([FromBody] ComplianceRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new ApiResponse<ComplianceResult>
                    {
                        Success = false,
                        Message = "Text content is required"
                    });
                }

                var userId = GetUserId();
                var result = await _aiModerationService.CheckComplianceAsync(request.Text, userId);

                return Ok(new ApiResponse<ComplianceResult>
                {
                    Success = true,
                    Data = result,
                    Message = result.IsCompliant ? "Content is compliant" : "Content violates policies"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking compliance");
                return StatusCode(500, new ApiResponse<ComplianceResult>
                {
                    Success = false,
                    Message = "Compliance check failed"
                });
            }
        }

        /// <summary>
        /// Get NudeNet model information
        /// </summary>
        [HttpGet("nudenet/info")]
        public async Task<ActionResult<ApiResponse<NudeNetModelInfo>>> GetNudeNetInfo()
        {
            try
            {
                var result = await _nudeNetService.GetModelInfoAsync();

                return Ok(new ApiResponse<NudeNetModelInfo>
                {
                    Success = true,
                    Data = result,
                    Message = result.IsAvailable ? "NudeNet model is available" : "NudeNet model is not available"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting NudeNet model info");
                return StatusCode(500, new ApiResponse<NudeNetModelInfo>
                {
                    Success = false,
                    Message = "Failed to get NudeNet model information"
                });
            }
        }

        /// <summary>
        /// Check if NudeNet service is available
        /// </summary>
        [HttpGet("nudenet/status")]
        public async Task<ActionResult<ApiResponse<bool>>> GetNudeNetStatus()
        {
            try
            {
                var isAvailable = await _nudeNetService.IsServiceAvailableAsync();

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Data = isAvailable,
                    Message = isAvailable ? "NudeNet service is available" : "NudeNet service is not available"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking NudeNet service status");
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to check NudeNet service status"
                });
            }
        }

        /// <summary>
        /// Batch moderate multiple images
        /// </summary>
        [HttpPost("batch/images")]
        public async Task<ActionResult<ApiResponse<List<NudeNetAnalysisResult>>>> BatchModerateImages([FromForm] BatchImageModerationRequest request)
        {
            try
            {
                if (request.ImageFiles == null || !request.ImageFiles.Any())
                {
                    return BadRequest(new ApiResponse<List<NudeNetAnalysisResult>>
                    {
                        Success = false,
                        Message = "Image files are required"
                    });
                }

                var userId = GetUserId();
                var imageRequests = new List<ImageAnalysisRequest>();

                foreach (var file in request.ImageFiles)
                {
                    using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);
                    imageRequests.Add(new ImageAnalysisRequest
                    {
                        ImageData = memoryStream.ToArray(),
                        UserId = userId
                    });
                }

                var results = await _nudeNetService.AnalyzeBatchImagesAsync(imageRequests);

                return Ok(new ApiResponse<List<NudeNetAnalysisResult>>
                {
                    Success = true,
                    Data = results,
                    Message = $"Batch analysis completed for {results.Count} images"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch image moderation");
                return StatusCode(500, new ApiResponse<List<NudeNetAnalysisResult>>
                {
                    Success = false,
                    Message = "Batch image moderation failed"
                });
            }
        }

        private string GetUserId()
        {
            return User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        }

        private ImageModerationResult CombineImageModerationResults(ImageModerationResult aiResult, NudeNetAnalysisResult nudeNetResult)
        {
            var combinedResult = new ImageModerationResult
            {
                UserId = aiResult.UserId,
                Timestamp = DateTime.UtcNow,
                IsApproved = aiResult.IsApproved && !nudeNetResult.IsNSFW,
                Confidence = Math.Max(aiResult.Confidence, nudeNetResult.Confidence),
                Violations = new List<ModerationViolation>(aiResult.Violations)
            };

            // Add NudeNet violations if any
            if (nudeNetResult.IsNSFW)
            {
                combinedResult.Violations.Add(new ModerationViolation
                {
                    Type = ViolationType.InappropriateImage,
                    Severity = ViolationSeverity.High,
                    Description = "NSFW content detected by NudeNet",
                    Confidence = nudeNetResult.Confidence,
                    SuggestedAction = ModerationAction.Block
                });
            }

            return combinedResult;
        }
    }

    // Request models
    public class TextModerationRequest
    {
        public string Text { get; set; } = string.Empty;
    }

    public class ImageModerationRequest
    {
        public IFormFile ImageFile { get; set; } = null!;
    }

    public class ImageUrlModerationRequest
    {
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class SentimentAnalysisRequest
    {
        public string Text { get; set; } = string.Empty;
    }

    public class SpamDetectionRequest
    {
        public string Text { get; set; } = string.Empty;
    }

    public class ContentSuggestionRequest
    {
        public string Text { get; set; } = string.Empty;
    }

    public class HashtagSuggestionRequest
    {
        public string Text { get; set; } = string.Empty;
    }

    public class ContentQualityRequest
    {
        public string Text { get; set; } = string.Empty;
    }

    public class ComplianceRequest
    {
        public string Text { get; set; } = string.Empty;
    }

    public class BatchImageModerationRequest
    {
        public List<IFormFile> ImageFiles { get; set; } = new();
    }
}
