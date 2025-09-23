using innkt.Social.DTOs;

namespace innkt.Social.Services;

public interface IMongoCommentService
{
    Task<CommentResponse> CreateCommentAsync(Guid postId, Guid userId, CreateCommentRequest request);
    Task<CommentListResponse> GetPostCommentsAsync(Guid postId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<CommentListResponse> GetNestedCommentsAsync(Guid parentCommentId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<int> GetNestedCommentsCountAsync(Guid parentCommentId);
    Task<CommentResponse> GetCommentByIdAsync(Guid commentId, Guid? currentUserId = null);
    Task<bool> DeleteCommentAsync(Guid commentId, Guid userId);
}
