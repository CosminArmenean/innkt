namespace innkt.NeuroSpark.Models;

public class ImageProcessingResult
{
    public string ProcessedImageUrl { get; set; } = string.Empty;
    public string OriginalImageUrl { get; set; } = string.Empty;
    public ProcessingStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; }
    public ProcessingOptions Options { get; set; } = new();
}

public class ProcessingOptions
{
    public bool RemoveBackground { get; set; } = true;
    public bool EnhanceQuality { get; set; } = true;
    public bool CropToSquare { get; set; } = true;
    public int TargetSize { get; set; } = 512;
    public string OutputFormat { get; set; } = "PNG";
}

public enum ProcessingStatus
{
    None,
    Unknown,
    Pending,
    Processing,
    Completed,
    Failed
}

public class ImageProcessingRequest
{
    public IFormFile Image { get; set; } = null!;
    public ProcessingOptions Options { get; set; } = new();
}

// Advanced Image Processing Models
public class BackgroundRemovalOptions
{
    public string Algorithm { get; set; } = "AI";
    public bool PreserveEdges { get; set; } = true;
    public string OutputFormat { get; set; } = "PNG";
    public int Quality { get; set; } = 90;
}

public class ImageEnhancementOptions
{
    public bool EnhanceBrightness { get; set; } = true;
    public bool EnhanceContrast { get; set; } = true;
    public bool EnhanceSharpness { get; set; } = true;
    public bool EnhanceColors { get; set; } = true;
    public string OutputFormat { get; set; } = "PNG";
    public int Quality { get; set; } = 90;
}

public class FaceCropOptions
{
    public int TargetSize { get; set; } = 512;
    public bool MaintainAspectRatio { get; set; } = true;
    public string OutputFormat { get; set; } = "PNG";
    public int Quality { get; set; } = 90;
}

public class BatchProcessingOptions
{
    public bool ProcessInParallel { get; set; } = true;
    public int MaxConcurrentTasks { get; set; } = 4;
    public string OutputFormat { get; set; } = "PNG";
    public int Quality { get; set; } = 90;
}

public class StyleTransferOptions
{
    public string Style { get; set; } = "Artistic";
    public float Intensity { get; set; } = 0.7f;
    public string OutputFormat { get; set; } = "PNG";
    public int Quality { get; set; } = 90;
}

public class BatchProcessingResult
{
    public List<ImageProcessingResult> Results { get; set; } = new();
    public int TotalProcessed { get; set; }
    public int Successful { get; set; }
    public int Failed { get; set; }
    public TimeSpan TotalProcessingTime { get; set; }
}

public class ImageQualityResult
{
    public double OverallScore { get; set; }
    public double SharpnessScore { get; set; }
    public double ContrastScore { get; set; }
    public double BrightnessScore { get; set; }
    public double ColorScore { get; set; }
    public string QualityLevel { get; set; } = string.Empty;
    public List<string> Recommendations { get; set; } = new();
}

public class ProcessingStatistics
{
    public Dictionary<string, int> ProcessingCounts { get; set; } = new();
    public Dictionary<string, long> AverageProcessingTimes { get; set; } = new();
    public Dictionary<string, int> SuccessRates { get; set; } = new();
    public Dictionary<string, int> ErrorCounts { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}
