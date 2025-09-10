using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Social.Models;

public class Post
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public string[] MediaUrls { get; set; } = Array.Empty<string>();
    
    public string[] Hashtags { get; set; } = Array.Empty<string>();
    
    public string[] Mentions { get; set; } = Array.Empty<string>();
    
    [MaxLength(255)]
    public string? Location { get; set; }
    
    public bool IsPublic { get; set; } = true;
    
    public bool IsPinned { get; set; } = false;
    
    public int LikesCount { get; set; } = 0;
    
    public int CommentsCount { get; set; } = 0;
    
    public int SharesCount { get; set; } = 0;
    
    public int ViewsCount { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
    public virtual ICollection<GroupPost> GroupPosts { get; set; } = new List<GroupPost>();
}

public class Comment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid PostId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
    
    public Guid? ParentCommentId { get; set; }
    
    public int LikesCount { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("PostId")]
    public virtual Post Post { get; set; } = null!;
    
    [ForeignKey("ParentCommentId")]
    public virtual Comment? ParentComment { get; set; }
    
    public virtual ICollection<Comment> Replies { get; set; } = new List<Comment>();
    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
}

public class Like
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid UserId { get; set; }
    
    public Guid? PostId { get; set; }
    
    public Guid? CommentId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("PostId")]
    public virtual Post? Post { get; set; }
    
    [ForeignKey("CommentId")]
    public virtual Comment? Comment { get; set; }
}
