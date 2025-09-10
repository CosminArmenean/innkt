using innkt.Social.DTOs;

namespace innkt.Social.Services;

public interface IPostService
{
    // Post operations
    Task<PostResponse> CreatePostAsync(Guid userId, CreatePostRequest request);
    Task<PostResponse?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null);
    Task<PostListResponse> GetUserPostsAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<PostListResponse> GetFeedAsync(Guid userId, FeedRequest request);
    Task<PostResponse> UpdatePostAsync(Guid postId, Guid userId, UpdatePostRequest request);
    Task<bool> DeletePostAsync(Guid postId, Guid userId);
    Task<bool> PinPostAsync(Guid postId, Guid userId);
    Task<bool> UnpinPostAsync(Guid postId, Guid userId);
    
    // Like operations
    Task<bool> LikePostAsync(Guid postId, Guid userId);
    Task<bool> UnlikePostAsync(Guid postId, Guid userId);
    Task<bool> IsPostLikedByUserAsync(Guid postId, Guid userId);
    
    // View tracking
    Task IncrementPostViewsAsync(Guid postId);
    
    // Search and discovery
    Task<PostListResponse> SearchPostsAsync(SearchRequest request, Guid? currentUserId = null);
    Task<PostListResponse> GetTrendingPostsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<PostListResponse> GetPostsByHashtagAsync(string hashtag, int page = 1, int pageSize = 20, Guid? currentUserId = null);
}

public interface ICommentService
{
    // Comment operations
    Task<CommentResponse> CreateCommentAsync(Guid postId, Guid userId, CreateCommentRequest request);
    Task<CommentResponse?> GetCommentByIdAsync(Guid commentId, Guid? currentUserId = null);
    Task<CommentListResponse> GetPostCommentsAsync(Guid postId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<CommentResponse> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentRequest request);
    Task<bool> DeleteCommentAsync(Guid commentId, Guid userId);
    
    // Like operations
    Task<bool> LikeCommentAsync(Guid commentId, Guid userId);
    Task<bool> UnlikeCommentAsync(Guid commentId, Guid userId);
    Task<bool> IsCommentLikedByUserAsync(Guid commentId, Guid userId);
}

public interface IFollowService
{
    // Follow operations
    Task<bool> FollowUserAsync(Guid followerId, Guid followingId);
    Task<bool> UnfollowUserAsync(Guid followerId, Guid followingId);
    Task<bool> IsFollowingAsync(Guid followerId, Guid followingId);
    
    // Get followers/following
    Task<FollowListResponse> GetFollowersAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<FollowListResponse> GetFollowingAsync(Guid userId, int page = 1, int pageSize = 20);
    
    // User stats
    Task<int> GetFollowersCountAsync(Guid userId);
    Task<int> GetFollowingCountAsync(Guid userId);
    
    // Mutual follows
    Task<FollowListResponse> GetMutualFollowsAsync(Guid userId1, Guid userId2, int page = 1, int pageSize = 20);
}
