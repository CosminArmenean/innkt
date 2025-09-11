import React, { useState, useEffect } from 'react';
import { socialService, Post, UserProfile } from '../../services/social.service';
import PostCreation from './PostCreation';
import LinkedAccountsPost from './LinkedAccountsPost';

interface SocialFeedProps {
  groupId?: string;
  userId?: string;
  showPostCreation?: boolean;
  linkedAccounts?: any[];
  currentUserId?: string;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ 
  groupId, 
  userId, 
  showPostCreation = true,
  linkedAccounts = [],
  currentUserId
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [linkedPosts, setLinkedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'verified' | 'blockchain' | 'ai-processed'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPosts(true);
    loadLinkedPosts();
  }, [groupId, userId, filter, sortBy]);

  const loadPosts = async (reset = false) => {
    if (reset) {
      setPage(1);
      setPosts([]);
    }

    try {
      setIsLoading(true);
      const response = await socialService.getPosts({
        groupId,
        userId,
        page: reset ? 1 : page + 1,
        limit: 20
      });

      if (reset) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }

      setHasMore(response.hasMore);
      setPage(reset ? 1 : page + 1);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLinkedPosts = () => {
    // TODO: Implement linked posts API endpoint
    // For now, return empty array
    setLinkedPosts([]);
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await socialService.unlikePost(postId);
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLiked: false, likesCount: p.likesCount - 1 }
            : p
        ));
      } else {
        await socialService.likePost(postId);
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      await socialService.sharePost(postId, {
        visibility: 'public',
        shareText: `Shared: ${post.content.substring(0, 100)}...`
      });

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, sharesCount: p.sharesCount + 1, isShared: true }
          : p
      ));
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  };

  const handleEdit = (postId: string) => {
    // This will be handled by the PostCard component
    console.log('Edit post:', postId);
  };

  const handleDelete = (postId: string) => {
    // Remove post from local state
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleReport = (postId: string) => {
    // This will be handled by the PostCard component
    console.log('Report post:', postId);
  };

  const filteredPosts = posts.filter(post => {
    switch (filter) {
      case 'verified':
        return post.authorProfile?.isVerified || false;
      case 'blockchain':
        return post.blockchainHash;
      case 'ai-processed':
        // TODO: Add AI processing indicator to post interface
        return false;
      default:
        return true;
    }
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.likesCount - a.likesCount;
      case 'trending':
        // Simple trending algorithm based on recent engagement
        const aScore = a.likesCount + a.commentsCount * 2 + a.sharesCount * 3;
        const bScore = b.likesCount + b.commentsCount * 2 + b.sharesCount * 3;
        return bScore - aScore;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPostVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return '🌍';
      case 'friends': return '👥';
      case 'group': return '👥';
      case 'private': return '🔒';
      default: return '🌍';
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'link': return '🔗';
      case 'poll': return '📊';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {groupId ? 'Group Posts' : userId ? 'User Posts' : 'Social Feed'}
          </h2>
          <p className="text-sm text-gray-600">
            Stay connected with your community
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary text-sm px-3 py-2"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="input-field"
              >
                <option value="all">All Posts</option>
                <option value="verified">Verified Users Only</option>
                <option value="blockchain">Blockchain Posts</option>
                <option value="ai-processed">AI Processed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-field"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => loadPosts(true)}
                className="btn-primary w-full"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Creation */}
      {showPostCreation && (
        <PostCreation
          onPostCreated={handlePostCreated}
          groupId={groupId}
        />
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {sortedPosts.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">📝</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">
              {showPostCreation 
                ? "Be the first to share something!" 
                : "No posts found with the current filters."
              }
            </p>
          </div>
        ) : (
          <>
            {/* Linked Accounts Posts */}
            {linkedPosts.map((post) => (
              <LinkedAccountsPost
                key={`linked-${post.id}`}
                post={post}
                linkedAccounts={linkedAccounts}
                currentUserId="current"
              />
            ))}
            
            {/* Regular Posts */}
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEcho={handleLike}
                onShare={handleShare}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReport={handleReport}
                formatDate={formatDate}
                getPostVisibilityIcon={getPostVisibilityIcon}
                getPostTypeIcon={getPostTypeIcon}
                currentUserId={currentUserId}
              />
            ))}
          </>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={() => loadPosts(false)}
              disabled={isLoading}
              className="btn-secondary px-6 py-2 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load More Posts'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Post Card Component
interface PostCardProps {
  post: Post;
  onEcho: (postId: string) => void;
  onShare: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  formatDate: (dateString: string) => string;
  getPostVisibilityIcon: (visibility: string) => string;
  getPostTypeIcon: (type: string) => string;
  currentUserId?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onEcho,
  onShare,
  onEdit,
  onDelete,
  onReport,
  formatDate,
  getPostVisibilityIcon,
  getPostTypeIcon,
  currentUserId
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const loadComments = async () => {
    if (isLoadingComments) return;
    
    setIsLoadingComments(true);
    try {
      const response = await socialService.getComments(post.id);
      setComments(response.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await socialService.createComment(post.id, commentText);
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    setIsSaving(true);
    try {
      await socialService.updatePost(post.id, { content: editContent });
      setIsEditing(false);
      // TODO: Update post in parent component
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await socialService.deletePost(post.id);
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(post.id);
    } else {
      // Default report behavior
      alert('Post reported. Thank you for helping keep our community safe.');
    }
  };

  const isOwnPost = currentUserId && post.authorProfile?.id === currentUserId;

  return (
    <div className="card">
      {/* Post Header */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {post.authorProfile?.avatar ? (
            <img 
              src={post.authorProfile?.avatar} 
              alt={post.authorProfile?.displayName || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-lg">
                {post.authorProfile?.displayName?.charAt(0).toUpperCase() || '👤'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 truncate">
                {post.authorProfile?.displayName || 'User'}
              </h3>
              
              {post.authorProfile?.isVerified && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  ✓ Verified
                </span>
              )}
              
              {post.authorProfile?.isKidAccount && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  👶 Kid
                </span>
              )}
            </div>
            
            {/* Options Menu */}
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {showOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {isOwnPost ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <span>✏️</span>
                          <span>Edit Post</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <span>🗑️</span>
                          <span>Delete Post</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            // TODO: Implement follow/unfollow functionality
                            // This would require passing the post author's ID and follow state
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <span>👤</span>
                          <span>Follow User</span>
                        </button>
                        <button
                          onClick={() => {
                            handleReport();
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <span>🚨</span>
                          <span>Report Post</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        // TODO: Implement save post
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <span>💾</span>
                      <span>Save Post</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{formatDate(post.createdAt)}</span>
            {post.updatedAt !== post.createdAt && (
              <>
                <span>•</span>
                <span className="text-gray-400">edited</span>
              </>
            )}
            <span>•</span>
            <span>{getPostTypeIcon(post.type)} {post.type}</span>
            <span>•</span>
            <span>{getPostVisibilityIcon(post.visibility)} {post.visibility}</span>
            
            {post.blockchainHash && (
              <>
                <span>•</span>
                <span className="text-purple-600">⛓️ Blockchain</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(post.content);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editContent.trim() || isSaving}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
        )}
        
        {/* Media Display */}
        {post.media && post.media.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {post.media.map((media, index) => (
              <div key={index} className="relative">
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={media.altText || 'Post media'}
                    className="w-full rounded-lg object-cover"
                  />
                ) : media.type === 'video' ? (
                  <video
                    src={media.url}
                    controls
                    className="w-full rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">📄 File</span>
                  </div>
                )}
                
                {media.caption && (
                  <p className="text-sm text-gray-600 mt-1">{media.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-innkt-light text-innkt-dark px-2 py-1 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {post.location && (
          <div className="mt-3 flex items-center space-x-1 text-sm text-gray-500">
            <span>📍</span>
            <span>{post.location.name}</span>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-6">
          {/* Echo Button with Reactions */}
          <div className="relative">
            <button
              onClick={() => onEcho(post.id)}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              className={`flex items-center space-x-2 transition-colors ${
                post.isLiked 
                  ? 'text-purple-600' 
                  : 'text-gray-500 hover:text-purple-600'
              }`}
            >
              <span className="text-xl">{post.isLiked ? '🔊' : '🔇'}</span>
              <span className="text-sm">{post.likesCount}</span>
            </button>
            
            {/* Echo Reaction Picker */}
            {showReactions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-gray-200 p-1 flex items-center space-x-1 z-20">
                {['🔊', '📢', '🎵', '💫', '⚡', '🌟'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      // TODO: Implement different echo reaction types
                      onEcho(post.id);
                      setShowReactions(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors text-lg"
                    title={`Echo with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleToggleComments}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <span className="text-xl">💬</span>
            <span className="text-sm">{post.commentsCount}</span>
          </button>
          
          <button
            onClick={() => onShare(post.id)}
            className={`flex items-center space-x-2 transition-colors ${
              post.isShared 
                ? 'text-green-500' 
                : 'text-gray-500 hover:text-green-500'
            }`}
          >
            <span className="text-xl">🔄</span>
            <span className="text-sm">{post.sharesCount}</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="text-gray-400 hover:text-gray-600 p-1">
            📌
          </button>
          <button className="text-gray-400 hover:text-gray-600 p-1">
            ⋯
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t">
          {/* Comment Input */}
          <div className="mb-4">
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 text-sm">👤</span>
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="bg-purple-600 text-white text-sm px-4 py-1 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comments List */}
          <div className="space-y-3">
            {isLoadingComments ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <p className="text-gray-500 mt-2">Loading comments...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {comment.authorProfile?.avatar ? (
                      <img
                        src={comment.authorProfile.avatar}
                        alt={comment.authorProfile.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">
                        {comment.authorProfile?.displayName?.charAt(0) || '👤'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.authorProfile?.displayName || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 ml-3">
                      <button className="text-xs text-gray-500 hover:text-purple-600 flex items-center space-x-1">
                        <span>🔊</span>
                        <span>Echo</span>
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-700">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;

