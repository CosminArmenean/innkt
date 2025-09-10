using System.ComponentModel.DataAnnotations;
using innkt.Common.Models;

namespace innkt.Domain.Models.Post;

public class Post : BaseEntity
{
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    [Required]
    public string AuthorId { get; set; } = string.Empty;
    
    public string? Category { get; set; }
    
    public List<string> Tags { get; set; } = new();
    
    public int Likes { get; set; } = 0;
    public int LikesCount => Likes;
    
    public int Views { get; set; } = 0;
    public int ViewsCount => Views;
    
    public int Comments { get; set; } = 0;
    public int CommentsCount => Comments;
    
    public int Shares { get; set; } = 0;
    public int SharesCount => Shares;
    
    public List<string> Media { get; set; } = new();
    public List<string> Hashtags { get; set; } = new();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsPublished { get; set; } = true;
}
