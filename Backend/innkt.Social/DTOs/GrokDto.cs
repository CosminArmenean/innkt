using System;

namespace innkt.Social.DTOs;

public class GrokRequestDto
{
    public string PostContent { get; set; } = string.Empty;
    public string UserQuestion { get; set; } = string.Empty;
    public string PostId { get; set; } = string.Empty;
    public string CommentId { get; set; } = string.Empty;
}

public class GrokResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "processing", "completed", "failed"
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string PostId { get; set; } = string.Empty;
    public string CommentId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
}

