using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Diagnostics;
using System.Text;

namespace innkt.NeuroSpark.Services
{
    public interface INudeNetModerationService
    {
        Task<NudeNetAnalysisResult> AnalyzeImageAsync(byte[] imageData, string userId);
        Task<NudeNetAnalysisResult> AnalyzeImageFromUrlAsync(string imageUrl, string userId);
        Task<List<NudeNetAnalysisResult>> AnalyzeBatchImagesAsync(List<ImageAnalysisRequest> requests);
        Task<NudeNetModelInfo> GetModelInfoAsync();
        Task<bool> IsServiceAvailableAsync();
    }

    public class NudeNetModerationService : INudeNetModerationService
    {
        private readonly ILogger<NudeNetModerationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _pythonScriptPath;
        private readonly string _modelPath;
        private readonly double _confidenceThreshold;

        public NudeNetModerationService(
            ILogger<NudeNetModerationService> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _pythonScriptPath = _configuration["NudeNet:PythonScriptPath"] ?? "Scripts/nudenet_analyzer.py";
            _modelPath = _configuration["NudeNet:ModelPath"] ?? "Models/nudenet";
            _confidenceThreshold = _configuration.GetValue<double>("NudeNet:ConfidenceThreshold", 0.5);
        }

        public async Task<NudeNetAnalysisResult> AnalyzeImageAsync(byte[] imageData, string userId)
        {
            try
            {
                _logger.LogInformation($"Starting NudeNet analysis for user {userId}");

                // Save image to temporary file
                var tempImagePath = Path.GetTempFileName() + ".jpg";
                await File.WriteAllBytesAsync(tempImagePath, imageData);

                try
                {
                    // Call Python script for analysis
                    var result = await CallNudeNetPythonScriptAsync(tempImagePath, userId);
                    
                    _logger.LogInformation($"NudeNet analysis completed for user {userId}. NSFW: {result.IsNSFW}, Confidence: {result.Confidence}");
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
                _logger.LogError(ex, $"Error analyzing image with NudeNet for user {userId}");
                return new NudeNetAnalysisResult
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsNSFW = false,
                    Confidence = 0.0,
                    Error = "NudeNet analysis failed due to technical error"
                };
            }
        }

        public async Task<NudeNetAnalysisResult> AnalyzeImageFromUrlAsync(string imageUrl, string userId)
        {
            try
            {
                _logger.LogInformation($"Starting NudeNet analysis from URL for user {userId}");

                // Download image from URL
                using var httpClient = new HttpClient();
                var imageData = await httpClient.GetByteArrayAsync(imageUrl);
                
                return await AnalyzeImageAsync(imageData, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error analyzing image from URL with NudeNet for user {userId}");
                return new NudeNetAnalysisResult
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsNSFW = false,
                    Confidence = 0.0,
                    Error = "NudeNet analysis from URL failed"
                };
            }
        }

        public async Task<List<NudeNetAnalysisResult>> AnalyzeBatchImagesAsync(List<ImageAnalysisRequest> requests)
        {
            try
            {
                _logger.LogInformation($"Starting batch NudeNet analysis for {requests.Count} images");

                var results = new List<NudeNetAnalysisResult>();
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

                    // Call Python script for batch analysis
                    var batchResult = await CallNudeNetBatchScriptAsync(tempFiles, requests.Select(r => r.UserId).ToList());
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

                _logger.LogInformation($"Batch NudeNet analysis completed. Processed {results.Count} images");
                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch NudeNet analysis");
                return requests.Select(r => new NudeNetAnalysisResult
                {
                    UserId = r.UserId,
                    Timestamp = DateTime.UtcNow,
                    IsNSFW = false,
                    Confidence = 0.0,
                    Error = "Batch NudeNet analysis failed"
                }).ToList();
            }
        }

        public async Task<NudeNetModelInfo> GetModelInfoAsync()
        {
            try
            {
                _logger.LogDebug("Getting NudeNet model information");

                var result = await CallNudeNetInfoScriptAsync();
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting NudeNet model info");
                return new NudeNetModelInfo
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
                _logger.LogDebug("Checking NudeNet service availability");

                var modelInfo = await GetModelInfoAsync();
                return modelInfo.IsAvailable;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking NudeNet service availability");
                return false;
            }
        }

        private async Task<NudeNetAnalysisResult> CallNudeNetPythonScriptAsync(string imagePath, string userId)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = $"\"{_pythonScriptPath}\" \"{imagePath}\" \"{_modelPath}\" {_confidenceThreshold}",
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
                    _logger.LogError($"NudeNet Python script failed with exit code {process.ExitCode}. Error: {error}");
                    throw new Exception($"NudeNet analysis failed: {error}");
                }

                var result = JsonSerializer.Deserialize<NudeNetAnalysisResult>(output, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    throw new Exception("Failed to parse NudeNet analysis result");
                }

                result.UserId = userId;
                result.Timestamp = DateTime.UtcNow;

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error calling NudeNet Python script for image: {imagePath}");
                throw;
            }
        }

        private async Task<List<NudeNetAnalysisResult>> CallNudeNetBatchScriptAsync(List<string> imagePaths, List<string> userIds)
        {
            try
            {
                var batchRequest = new
                {
                    ImagePaths = imagePaths,
                    UserIds = userIds,
                    ModelPath = _modelPath,
                    ConfidenceThreshold = _confidenceThreshold
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

                    var output = await process.StandardOutput.ReadToEndAsync();
                    var error = await process.StandardError.ReadToEndAsync();

                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0)
                    {
                        _logger.LogError($"NudeNet batch script failed with exit code {process.ExitCode}. Error: {error}");
                        throw new Exception($"NudeNet batch analysis failed: {error}");
                    }

                    var results = JsonSerializer.Deserialize<List<NudeNetAnalysisResult>>(output, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (results == null)
                    {
                        throw new Exception("Failed to parse NudeNet batch analysis results");
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
                _logger.LogError(ex, "Error calling NudeNet batch script");
                throw;
            }
        }

        private async Task<NudeNetModelInfo> CallNudeNetInfoScriptAsync()
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
                    _logger.LogError($"NudeNet info script failed with exit code {process.ExitCode}. Error: {error}");
                    return new NudeNetModelInfo
                    {
                        ModelName = "Unknown",
                        Version = "Unknown",
                        IsAvailable = false,
                        Error = error
                    };
                }

                var result = JsonSerializer.Deserialize<NudeNetModelInfo>(output, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    throw new Exception("Failed to parse NudeNet model info");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling NudeNet info script");
                throw;
            }
        }
    }

    // Data models for NudeNet integration
    public class NudeNetAnalysisResult
    {
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsNSFW { get; set; }
        public double Confidence { get; set; }
        public List<NSFWDetection> Detections { get; set; } = new();
        public string? Error { get; set; }
    }

    public class NSFWDetection
    {
        public string Class { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public BoundingBox BoundingBox { get; set; } = new();
    }

    public class BoundingBox
    {
        public double X { get; set; }
        public double Y { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
    }

    public class NudeNetModelInfo
    {
        public string ModelName { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public string? Error { get; set; }
    }

    public class ImageAnalysisRequest
    {
        public byte[] ImageData { get; set; } = Array.Empty<byte>();
        public string UserId { get; set; } = string.Empty;
    }
}
