using Microsoft.EntityFrameworkCore;
using innkt.Social.Data;
using innkt.Social.DTOs;
using innkt.Social.Models;
using AutoMapper;

namespace innkt.Social.Services;

public class CommentService : ICommentService
{
    private readonly SocialDbContext _context;
    private readonly ILogger<CommentService> _logger;
    private readonly IMapper _mapper;

    public CommentService(SocialDbContext context, ILogger<CommentService> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<CommentResponse> CreateCommentAsync(Guid postId, Guid userId, CreateCommentRequest request)
    {
        // Verify post exists
        var post = await _context.Posts.FindAsync(postId);
        if (post == null)
            throw new KeyNotFoundException("Post not found");

        var comment = new Comment
        {
            PostId = postId,
            UserId = userId,
            Content = request.Content,
            ParentCommentId = request.ParentCommentId
        };

        _context.Comments.Add(comment);

        // Update comment count on post
        post.CommentsCount++;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Created comment {CommentId} for post {PostId} by user {UserId}", 
            comment.Id, postId, userId);

        return await GetCommentByIdAsync(comment.Id, userId);
    }

    public async Task<CommentResponse?> GetCommentByIdAsync(Guid commentId, Guid? currentUserId = null)
    {
        var comment = await _context.Comments
            .Include(c => c.Replies)
            .Include(c => c.Likes)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null)
            return null;

        var response = _mapper.Map<CommentResponse>(comment);
        
        if (currentUserId.HasValue)
        {
            response.IsLikedByCurrentUser = await IsCommentLikedByUserAsync(commentId, currentUserId.Value);
        }

        // Map replies
        var replies = new List<CommentResponse>();
        foreach (var reply in comment.Replies)
        {
            var replyResponse = _mapper.Map<CommentResponse>(reply);
            if (currentUserId.HasValue)
            {
                replyResponse.IsLikedByCurrentUser = await IsCommentLikedByUserAsync(reply.Id, currentUserId.Value);
            }
            replies.Add(replyResponse);
        }
        response.Replies = replies;

        return response;
    }

    public async Task<CommentListResponse> GetPostCommentsAsync(Guid postId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var query = _context.Comments
            .Where(c => c.PostId == postId && c.ParentCommentId == null) // Only top-level comments
            .OrderByDescending(c => c.CreatedAt);

        var totalCount = await query.CountAsync();
        var comments = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(c => c.Replies)
            .ToListAsync();

        var responses = new List<CommentResponse>();
        foreach (var comment in comments)
        {
            var response = _mapper.Map<CommentResponse>(comment);
            if (currentUserId.HasValue)
            {
                response.IsLikedByCurrentUser = await IsCommentLikedByUserAsync(comment.Id, currentUserId.Value);
            }

            // Map replies
            var replies = new List<CommentResponse>();
            foreach (var reply in comment.Replies)
            {
                var replyResponse = _mapper.Map<CommentResponse>(reply);
                if (currentUserId.HasValue)
                {
                    replyResponse.IsLikedByCurrentUser = await IsCommentLikedByUserAsync(reply.Id, currentUserId.Value);
                }
                replies.Add(replyResponse);
            }
            response.Replies = replies;

            responses.Add(response);
        }

        return new CommentListResponse
        {
            Comments = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<CommentResponse> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentRequest request)
    {
        var comment = await _context.Comments.FindAsync(commentId);
        if (comment == null)
            throw new KeyNotFoundException("Comment not found");

        if (comment.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own comments");

        comment.Content = request.Content;
        comment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated comment {CommentId} by user {UserId}", commentId, userId);
        return await GetCommentByIdAsync(commentId, userId);
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid userId)
    {
        var comment = await _context.Comments.FindAsync(commentId);
        if (comment == null)
            return false;

        if (comment.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own comments");

        // Update comment count on post
        var post = await _context.Posts.FindAsync(comment.PostId);
        if (post != null)
        {
            post.CommentsCount--;
        }

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted comment {CommentId} by user {UserId}", commentId, userId);
        return true;
    }

    public async Task<bool> LikeCommentAsync(Guid commentId, Guid userId)
    {
        var existingLike = await _context.Likes
            .FirstOrDefaultAsync(l => l.CommentId == commentId && l.UserId == userId);

        if (existingLike != null)
            return false; // Already liked

        var like = new Like
        {
            CommentId = commentId,
            UserId = userId
        };

        _context.Likes.Add(like);

        // Update like count
        var comment = await _context.Comments.FindAsync(commentId);
        if (comment != null)
        {
            comment.LikesCount++;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} liked comment {CommentId}", userId, commentId);
        return true;
    }

    public async Task<bool> UnlikeCommentAsync(Guid commentId, Guid userId)
    {
        var like = await _context.Likes
            .FirstOrDefaultAsync(l => l.CommentId == commentId && l.UserId == userId);

        if (like == null)
            return false; // Not liked

        _context.Likes.Remove(like);

        // Update like count
        var comment = await _context.Comments.FindAsync(commentId);
        if (comment != null)
        {
            comment.LikesCount--;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} unliked comment {CommentId}", userId, commentId);
        return true;
    }

    public async Task<bool> IsCommentLikedByUserAsync(Guid commentId, Guid userId)
    {
        return await _context.Likes
            .AnyAsync(l => l.CommentId == commentId && l.UserId == userId);
    }
}
