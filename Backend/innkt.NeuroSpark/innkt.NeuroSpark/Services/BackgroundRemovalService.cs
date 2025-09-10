using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;

namespace innkt.NeuroSpark.Services
{
    public interface IBackgroundRemovalService
    {
        Task<BackgroundRemovalResult> RemoveBackgroundAsync(byte[] imageData, string userId, BackgroundRemovalOptions? options = null);
        Task<BackgroundRemovalResult> RemoveBackgroundFromUrlAsync(string imageUrl, string userId, BackgroundRemovalOptions? options = null);
        Task<List<BackgroundRemovalResult>> RemoveBackgroundBatchAsync(List<BackgroundRemovalRequest> requests);
        Task<BackgroundRemovalModelInfo> GetModelInfoAsync();
        Task<bool> IsServiceAvailableAsync();
        Task<byte[]> ProcessAvatarAsync(byte[] imageData, string userId, AvatarProcessingOptions? options = null);
    }

    public class BackgroundRemovalService : IBackgroundRemovalService
    {
        private readonly ILogger<BackgroundRemovalService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _pythonScriptPath;
        private readonly string _modelPath;
        private readonly string _outputPath;
        private readonly int _maxImageSize;
        private readonly int _timeoutSeconds;

        public BackgroundRemovalService(
            ILogger<BackgroundRemovalService> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _pythonScriptPath = _configuration["BackgroundRemoval:PythonScriptPath"] ?? "Scripts/background_removal.py";
            _modelPath = _configuration["BackgroundRemoval:ModelPath"] ?? "Models/rembg";
            _outputPath = _configuration["BackgroundRemoval:OutputPath"] ?? "processed/background_removed";
            _maxImageSize = _configuration.GetValue<int>("BackgroundRemoval:MaxImageSize", 2048);
            _timeoutSeconds = _configuration.GetValue<int>("BackgroundRemoval:TimeoutSeconds", 60);

            // Ensure output directory exists
            Directory.CreateDirectory(_outputPath);
        }

        public async Task<BackgroundRemovalResult> RemoveBackgroundAsync(byte[] imageData, string userId, BackgroundRemovalOptions? options = null)
        {
            try
            {
                _logger.LogInformation($"Starting background removal for user {userId}");

                // Validate image data
                if (imageData == null || imageData.Length == 0)
                {
                    return new BackgroundRemovalResult
                    {
                        UserId = userId,
                        Timestamp = DateTime.UtcNow,
                        Success = false,
                        Error = "No image data provided"
                    };
                }

                // Validate image size
                if (imageData.Length > 10 * 1024 * 1024) // 10MB limit
                {
                    return new BackgroundRemovalResult
                    {
                        UserId = userId,
                        Timestamp = DateTime.UtcNow,
                        Success = false,
                        Error = "Image size exceeds 10MB limit"
                    };
                }

                // Save image to temporary file
                var tempImagePath = Path.GetTempFileName() + ".jpg";
                await File.WriteAllBytesAsync(tempImagePath, imageData);

                try
                {
                    // Call Python script for background removal
                    var result = await CallBackgroundRemovalScriptAsync(tempImagePath, userId, options);
                    
                    _logger.LogInformation($"Background removal completed for user {userId}. Success: {result.Success}");
                    return result;
                }
                finally
                {
                    // Clean up temporary file
                    if (File.Exists(tempImagePath))
                    {
                        File.Delete(tempImagePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing background for user {userId}");
                return new BackgroundRemovalResult
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    Success = false,
                    Error = "Background removal failed due to technical error"
                };
            }
        }

        public async Task<BackgroundRemovalResult> RemoveBackgroundFromUrlAsync(string imageUrl, string userId, BackgroundRemovalOptions? options = null)
        {
            try
            {
                _logger.LogInformation($"Starting background removal from URL for user {userId}");

                // Download image from URL
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);
                var imageData = await httpClient.GetByteArrayAsync(imageUrl);
                
                return await RemoveBackgroundAsync(imageData, userId, options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing background from URL for user {userId}");
                return new BackgroundRemovalResult
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    Success = false,
                    Error = "Background removal from URL failed"
                };
            }
        }

        public async Task<List<BackgroundRemovalResult>> RemoveBackgroundBatchAsync(List<BackgroundRemovalRequest> requests)
        {
            try
            {
                _logger.LogInformation($"Starting batch background removal for {requests.Count} images");

                var results = new List<BackgroundRemovalResult>();
                var tempFiles = new List<string>();

                try
                {
                    // Save all images to temporary files
                    foreach (var request in requests)
                    {
                        var tempImagePath = Path.GetTempFileName() + ".jpg";
                        await File.WriteAllBytesAsync(tempImagePath, request.ImageData);
                        tempFiles.Add(tempImagePath);
                    }

                    // Call Python script for batch processing
                    var batchResult = await CallBackgroundRemovalBatchScriptAsync(tempFiles, requests, _outputPath);
                    results.AddRange(batchResult);
                }
                finally
                {
                    // Clean up temporary files
                    foreach (var tempFile in tempFiles)
                    {
                        if (File.Exists(tempFile))
                        {
                            File.Delete(tempFile);
                        }
                    }
                }

                _logger.LogInformation($"Batch background removal completed. Processed {results.Count} images");
                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch background removal");
                return requests.Select(r => new BackgroundRemovalResult
                {
                    UserId = r.UserId,
                    Timestamp = DateTime.UtcNow,
                    Success = false,
                    Error = "Batch background removal failed"
                }).ToList();
            }
        }

        public async Task<BackgroundRemovalModelInfo> GetModelInfoAsync()
        {
            try
            {
                _logger.LogDebug("Getting background removal model information");

                var result = await CallBackgroundRemovalInfoScriptAsync();
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting background removal model info");
                return new BackgroundRemovalModelInfo
                {
                    ModelName = "Unknown",
                    Version = "Unknown",
                    IsAvailable = false,
                    Error = "Failed to get model information"
                };
            }
        }

        public async Task<bool> IsServiceAvailableAsync()
        {
            try
            {
                _logger.LogDebug("Checking background removal service availability");

                var modelInfo = await GetModelInfoAsync();
                return modelInfo.IsAvailable;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking background removal service availability");
                return false;
            }
        }

        public async Task<byte[]> ProcessAvatarAsync(byte[] imageData, string userId, AvatarProcessingOptions? options = null)
        {
            try
            {
                _logger.LogInformation($"Processing avatar for user {userId}");

                // Set default options for avatar processing
                var avatarOptions = options ?? new AvatarProcessingOptions
                {
                    RemoveBackground = true,
                    ResizeTo = 512,
                    Format = "PNG",
                    Quality = 95,
                    AddBorder = true,
                    BorderColor = "#FFFFFF",
                    BorderWidth = 4,
                    RoundCorners = true,
                    CornerRadius = 256
                };

                // Remove background
                var backgroundResult = await RemoveBackgroundAsync(imageData, userId, new BackgroundRemovalOptions
                {
                    Model = "u2net",
                    OutputFormat = avatarOptions.Format,
                    Quality = avatarOptions.Quality
                });

                if (!backgroundResult.Success)
                {
                    throw new Exception($"Background removal failed: {backgroundResult.Error}");
                }

                // Load the processed image
                byte[] processedImageData;
                if (!string.IsNullOrEmpty(backgroundResult.ProcessedImagePath) && File.Exists(backgroundResult.ProcessedImagePath))
                {
                    processedImageData = await File.ReadAllBytesAsync(backgroundResult.ProcessedImagePath);
                }
                else if (backgroundResult.ProcessedImageData != null)
                {
                    processedImageData = backgroundResult.ProcessedImageData;
                }
                else
                {
                    throw new Exception("No processed image data available");
                }

                // Apply avatar-specific processing
                var finalImageData = await ApplyAvatarProcessingAsync(processedImageData, avatarOptions);

                _logger.LogInformation($"Avatar processing completed for user {userId}");
                return finalImageData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing avatar for user {userId}");
                throw;
            }
        }

        private async Task<BackgroundRemovalResult> CallBackgroundRemovalScriptAsync(string imagePath, string userId, BackgroundRemovalOptions? options)
        {
            try
            {
                var optionsJson = options != null ? JsonSerializer.Serialize(options) : "{}";
                var tempOptionsFile = Path.GetTempFileName() + ".json";
                await File.WriteAllTextAsync(tempOptionsFile, optionsJson);

                try
                {
                    var startInfo = new ProcessStartInfo
                    {
                        FileName = "python",
                        Arguments = $"\"{_pythonScriptPath}\" \"{imagePath}\" \"{_modelPath}\" \"{_outputPath}\" \"{tempOptionsFile}\"",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    using var process = new Process { StartInfo = startInfo };
                    process.Start();

                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_timeoutSeconds));
                    try
                    {
                        await process.WaitForExitAsync(cts.Token);
                    }
                    catch (OperationCanceledException)
                    {
                        process.Kill();
                        throw new Exception($"Background removal timed out after {_timeoutSeconds} seconds");
                    }

                    var output = await process.StandardOutput.ReadToEndAsync();
                    var error = await process.StandardError.ReadToEndAsync();

                    if (process.ExitCode != 0)
                    {
                        _logger.LogError($"Background removal script failed with exit code {process.ExitCode}. Error: {error}");
                        throw new Exception($"Background removal failed: {error}");
                    }

                    var result = JsonSerializer.Deserialize<BackgroundRemovalResult>(output, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result == null)
                    {
                        throw new Exception("Failed to parse background removal result");
                    }

                    result.UserId = userId;
                    result.Timestamp = DateTime.UtcNow;

                    return result;
                }
                finally
                {
                    if (File.Exists(tempOptionsFile))
                    {
                        File.Delete(tempOptionsFile);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error calling background removal script for image: {imagePath}");
                throw;
            }
        }

        private async Task<List<BackgroundRemovalResult>> CallBackgroundRemovalBatchScriptAsync(List<string> imagePaths, List<BackgroundRemovalRequest> requests, string outputPath)
        {
            try
            {
                var batchRequest = new
                {
                    ImagePaths = imagePaths,
                    Requests = requests.Select(r => new
                    {
                        UserId = r.UserId,
                        Options = r.Options
                    }).ToList(),
                    ModelPath = _modelPath,
                    OutputPath = outputPath
                };

                var jsonRequest = JsonSerializer.Serialize(batchRequest);
                var tempRequestFile = Path.GetTempFileName() + ".json";
                await File.WriteAllTextAsync(tempRequestFile, jsonRequest);

                try
                {
                    var startInfo = new ProcessStartInfo
                    {
                        FileName = "python",
                        Arguments = $"\"{_pythonScriptPath}\" --batch \"{tempRequestFile}\"",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    using var process = new Process { StartInfo = startInfo };
                    process.Start();

                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_timeoutSeconds));
                    try
                    {
                        await process.WaitForExitAsync(cts.Token);
                    }
                    catch (OperationCanceledException)
                    {
                        process.Kill();
                        throw new Exception($"Batch background removal timed out after {_timeoutSeconds} seconds");
                    }

                    var output = await process.StandardOutput.ReadToEndAsync();
                    var error = await process.StandardError.ReadToEndAsync();

                    if (process.ExitCode != 0)
                    {
                        _logger.LogError($"Background removal batch script failed with exit code {process.ExitCode}. Error: {error}");
                        throw new Exception($"Batch background removal failed: {error}");
                    }

                    var results = JsonSerializer.Deserialize<List<BackgroundRemovalResult>>(output, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (results == null)
                    {
                        throw new Exception("Failed to parse batch background removal results");
                    }

                    // Set timestamps
                    foreach (var result in results)
                    {
                        result.Timestamp = DateTime.UtcNow;
                    }

                    return results;
                }
                finally
                {
                    if (File.Exists(tempRequestFile))
                    {
                        File.Delete(tempRequestFile);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling background removal batch script");
                throw;
            }
        }

        private async Task<BackgroundRemovalModelInfo> CallBackgroundRemovalInfoScriptAsync()
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = $"\"{_pythonScriptPath}\" --info \"{_modelPath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = new Process { StartInfo = startInfo };
                process.Start();

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    _logger.LogError($"Background removal info script failed with exit code {process.ExitCode}. Error: {error}");
                    return new BackgroundRemovalModelInfo
                    {
                        ModelName = "Unknown",
                        Version = "Unknown",
                        IsAvailable = false,
                        Error = error
                    };
                }

                var result = JsonSerializer.Deserialize<BackgroundRemovalModelInfo>(output, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    throw new Exception("Failed to parse background removal model info");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling background removal info script");
                throw;
            }
        }

        private async Task<byte[]> ApplyAvatarProcessingAsync(byte[] imageData, AvatarProcessingOptions options)
        {
            try
            {
                using var originalStream = new MemoryStream(imageData);
                using var originalImage = Image.FromStream(originalStream);

                // Resize image if needed
                var targetSize = options.ResizeTo;
                if (originalImage.Width != targetSize || originalImage.Height != targetSize)
                {
                    using var resizedImage = new Bitmap(targetSize, targetSize);
                    using var graphics = Graphics.FromImage(resizedImage);
                    graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                    graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                    graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;

                    graphics.DrawImage(originalImage, 0, 0, targetSize, targetSize);

                    // Apply border if requested
                    if (options.AddBorder)
                    {
                        var borderColor = ColorTranslator.FromHtml(options.BorderColor);
                        using var borderPen = new Pen(borderColor, options.BorderWidth);
                        graphics.DrawRectangle(borderPen, 0, 0, targetSize - 1, targetSize - 1);
                    }

                    // Apply rounded corners if requested
                    if (options.RoundCorners)
                    {
                        // Create rounded rectangle path
                        var path = new System.Drawing.Drawing2D.GraphicsPath();
                        var radius = options.CornerRadius;
                        path.AddArc(0, 0, radius * 2, radius * 2, 180, 90);
                        path.AddArc(targetSize - radius * 2, 0, radius * 2, radius * 2, 270, 90);
                        path.AddArc(targetSize - radius * 2, targetSize - radius * 2, radius * 2, radius * 2, 0, 90);
                        path.AddArc(0, targetSize - radius * 2, radius * 2, radius * 2, 90, 90);
                        path.CloseFigure();

                        // Apply clipping
                        graphics.SetClip(path);
                    }

                    // Save processed image
                    using var processedStream = new MemoryStream();
                    var format = options.Format.ToUpper() switch
                    {
                        "PNG" => ImageFormat.Png,
                        "JPEG" or "JPG" => ImageFormat.Jpeg,
                        "WEBP" => ImageFormat.Webp,
                        _ => ImageFormat.Png
                    };

                    resizedImage.Save(processedStream, format);
                    return processedStream.ToArray();
                }

                return imageData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying avatar processing");
                throw;
            }
        }
    }

    // Data models for background removal
    public class BackgroundRemovalResult
    {
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool Success { get; set; }
        public string? ProcessedImagePath { get; set; }
        public byte[]? ProcessedImageData { get; set; }
        public string? OriginalImagePath { get; set; }
        public BackgroundRemovalOptions? Options { get; set; }
        public string? Error { get; set; }
        public TimeSpan ProcessingTime { get; set; }
    }

    public class BackgroundRemovalOptions
    {
        public string Model { get; set; } = "u2net";
        public string OutputFormat { get; set; } = "PNG";
        public int Quality { get; set; } = 95;
        public bool PreserveTransparency { get; set; } = true;
        public int? MaxSize { get; set; }
        public bool OptimizeForWeb { get; set; } = true;
    }

    public class BackgroundRemovalRequest
    {
        public byte[] ImageData { get; set; } = Array.Empty<byte>();
        public string UserId { get; set; } = string.Empty;
        public BackgroundRemovalOptions? Options { get; set; }
    }

    public class BackgroundRemovalModelInfo
    {
        public string ModelName { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public List<string> AvailableModels { get; set; } = new();
        public string? Error { get; set; }
    }

    public class AvatarProcessingOptions
    {
        public bool RemoveBackground { get; set; } = true;
        public int ResizeTo { get; set; } = 512;
        public string Format { get; set; } = "PNG";
        public int Quality { get; set; } = 95;
        public bool AddBorder { get; set; } = true;
        public string BorderColor { get; set; } = "#FFFFFF";
        public int BorderWidth { get; set; } = 4;
        public bool RoundCorners { get; set; } = true;
        public int CornerRadius { get; set; } = 256;
    }
}
