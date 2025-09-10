using Microsoft.EntityFrameworkCore;
using innkt.Social.Data;
using innkt.Social.DTOs;
using innkt.Social.Models;
using AutoMapper;

namespace innkt.Social.Services;

public class PostService : IPostService
{
    private readonly SocialDbContext _context;
    private readonly ILogger<PostService> _logger;
    private readonly IMapper _mapper;

    public PostService(SocialDbContext context, ILogger<PostService> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<PostResponse> CreatePostAsync(Guid userId, CreatePostRequest request)
    {
        var post = new Post
        {
            UserId = userId,
            Content = request.Content,
            MediaUrls = request.MediaUrls,
            Hashtags = request.Hashtags,
            Mentions = request.Mentions,
            Location = request.Location,
            IsPublic = request.IsPublic
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created post {PostId} for user {UserId}", post.Id, userId);
        return await GetPostByIdAsync(post.Id, userId);
    }

    public async Task<PostResponse?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null)
    {
        var post = await _context.Posts
            .Include(p => p.Comments)
            .Include(p => p.Likes)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null)
            return null;

        var response = _mapper.Map<PostResponse>(post);
        
        if (currentUserId.HasValue)
        {
            response.IsLikedByCurrentUser = await IsPostLikedByUserAsync(postId, currentUserId.Value);
        }

        // Increment view count
        await IncrementPostViewsAsync(postId);

        return response;
    }

    public async Task<PostListResponse> GetUserPostsAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var query = _context.Posts
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var posts = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<PostResponse>();
        foreach (var post in posts)
        {
            var response = _mapper.Map<PostResponse>(post);
            if (currentUserId.HasValue)
            {
                response.IsLikedByCurrentUser = await IsPostLikedByUserAsync(post.Id, currentUserId.Value);
            }
            responses.Add(response);
        }

        return new PostListResponse
        {
            Posts = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<PostListResponse> GetFeedAsync(Guid userId, FeedRequest request)
    {
        // Get users that the current user follows
        var followingIds = await _context.Follows
            .Where(f => f.FollowerId == userId)
            .Select(f => f.FollowingId)
            .ToListAsync();

        // Include user's own posts in feed
        followingIds.Add(userId);

        var query = _context.Posts
            .Where(p => followingIds.Contains(p.UserId) && p.IsPublic);

        // Apply filters
        if (!string.IsNullOrEmpty(request.Hashtag))
        {
            query = query.Where(p => p.Hashtags.Contains(request.Hashtag));
        }

        if (!string.IsNullOrEmpty(request.Location))
        {
            query = query.Where(p => p.Location == request.Location);
        }

        if (request.Since.HasValue)
        {
            query = query.Where(p => p.CreatedAt >= request.Since.Value);
        }

        if (request.Until.HasValue)
        {
            query = query.Where(p => p.CreatedAt <= request.Until.Value);
        }

        query = query.OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var posts = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var responses = new List<PostResponse>();
        foreach (var post in posts)
        {
            var response = _mapper.Map<PostResponse>(post);
            response.IsLikedByCurrentUser = await IsPostLikedByUserAsync(post.Id, userId);
            responses.Add(response);
        }

        return new PostListResponse
        {
            Posts = responses,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = request.Page * request.PageSize < totalCount,
            HasPreviousPage = request.Page > 1
        };
    }

    public async Task<PostResponse> UpdatePostAsync(Guid postId, Guid userId, UpdatePostRequest request)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null)
            throw new KeyNotFoundException("Post not found");

        if (post.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own posts");

        post.Content = request.Content;
        post.MediaUrls = request.MediaUrls;
        post.Hashtags = request.Hashtags;
        post.Mentions = request.Mentions;
        post.Location = request.Location;
        post.IsPublic = request.IsPublic;
        post.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated post {PostId} by user {UserId}", postId, userId);
        return await GetPostByIdAsync(postId, userId);
    }

    public async Task<bool> DeletePostAsync(Guid postId, Guid userId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null)
            return false;

        if (post.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own posts");

        _context.Posts.Remove(post);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted post {PostId} by user {UserId}", postId, userId);
        return true;
    }

    public async Task<bool> PinPostAsync(Guid postId, Guid userId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null || post.UserId != userId)
            return false;

        post.IsPinned = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Pinned post {PostId} by user {UserId}", postId, userId);
        return true;
    }

    public async Task<bool> UnpinPostAsync(Guid postId, Guid userId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null || post.UserId != userId)
            return false;

        post.IsPinned = false;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Unpinned post {PostId} by user {UserId}", postId, userId);
        return true;
    }

    public async Task<bool> LikePostAsync(Guid postId, Guid userId)
    {
        var existingLike = await _context.Likes
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

        if (existingLike != null)
            return false; // Already liked

        var like = new Like
        {
            PostId = postId,
            UserId = userId
        };

        _context.Likes.Add(like);

        // Update like count
        var post = await _context.Posts.FindAsync(postId);
        if (post != null)
        {
            post.LikesCount++;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} liked post {PostId}", userId, postId);
        return true;
    }

    public async Task<bool> UnlikePostAsync(Guid postId, Guid userId)
    {
        var like = await _context.Likes
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

        if (like == null)
            return false; // Not liked

        _context.Likes.Remove(like);

        // Update like count
        var post = await _context.Posts.FindAsync(postId);
        if (post != null)
        {
            post.LikesCount--;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} unliked post {PostId}", userId, postId);
        return true;
    }

    public async Task<bool> IsPostLikedByUserAsync(Guid postId, Guid userId)
    {
        return await _context.Likes
            .AnyAsync(l => l.PostId == postId && l.UserId == userId);
    }

    public async Task IncrementPostViewsAsync(Guid postId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post != null)
        {
            post.ViewsCount++;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<PostListResponse> SearchPostsAsync(SearchRequest request, Guid? currentUserId = null)
    {
        var query = _context.Posts
            .Where(p => p.IsPublic && 
                       (p.Content.Contains(request.Query) ||
                        p.Hashtags.Any(h => h.Contains(request.Query)) ||
                        p.Mentions.Any(m => m.Contains(request.Query))));

        if (!string.IsNullOrEmpty(request.Hashtag))
        {
            query = query.Where(p => p.Hashtags.Contains(request.Hashtag));
        }

        if (!string.IsNullOrEmpty(request.Location))
        {
            query = query.Where(p => p.Location == request.Location);
        }

        query = query.OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var posts = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var responses = new List<PostResponse>();
        foreach (var post in posts)
        {
            var response = _mapper.Map<PostResponse>(post);
            if (currentUserId.HasValue)
            {
                response.IsLikedByCurrentUser = await IsPostLikedByUserAsync(post.Id, currentUserId.Value);
            }
            responses.Add(response);
        }

        return new PostListResponse
        {
            Posts = responses,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = request.Page * request.PageSize < totalCount,
            HasPreviousPage = request.Page > 1
        };
    }

    public async Task<PostListResponse> GetTrendingPostsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        // Simple trending algorithm based on likes and recency
        var query = _context.Posts
            .Where(p => p.IsPublic)
            .OrderByDescending(p => p.LikesCount * 0.7 + p.CommentsCount * 0.3)
            .ThenByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var posts = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<PostResponse>();
        foreach (var post in posts)
        {
            var response = _mapper.Map<PostResponse>(post);
            if (currentUserId.HasValue)
            {
                response.IsLikedByCurrentUser = await IsPostLikedByUserAsync(post.Id, currentUserId.Value);
            }
            responses.Add(response);
        }

        return new PostListResponse
        {
            Posts = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<PostListResponse> GetPostsByHashtagAsync(string hashtag, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var query = _context.Posts
            .Where(p => p.IsPublic && p.Hashtags.Contains(hashtag))
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var posts = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<PostResponse>();
        foreach (var post in posts)
        {
            var response = _mapper.Map<PostResponse>(post);
            if (currentUserId.HasValue)
            {
                response.IsLikedByCurrentUser = await IsPostLikedByUserAsync(post.Id, currentUserId.Value);
            }
            responses.Add(response);
        }

        return new PostListResponse
        {
            Posts = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }
}
