using innkt.Social.DTOs;
using System;
using System.Threading.Tasks;

namespace innkt.Social.Services;

public interface INeuroSparkService
{
    Task<NeuroSparkGrokResponse> ProcessGrokRequestAsync(NeuroSparkGrokRequest request);
}

public class NeuroSparkGrokRequest
{
    public string PostContent { get; set; } = string.Empty;
    public string UserQuestion { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string PostId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
}

public class NeuroSparkGrokResponse
{
    public string Response { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}

