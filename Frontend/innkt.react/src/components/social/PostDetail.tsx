import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socialService, Post, Comment } from '../../services/social.service';
import { ArrowLeft, Bell, Home, Heart, MessageCircle, Share2, MoreHorizontal, ChevronDown, ChevronUp, Reply, Flag, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loadingRecentPosts, setLoadingRecentPosts] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  
  // Pagination and loading states
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentsPage, setCommentsPage] = useState(1);
  const [nestedCommentsLoaded, setNestedCommentsLoaded] = useState<Set<string>>(new Set());
  
  const COMMENTS_PER_PAGE = 15;

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  useEffect(() => {
    // Check if there's a comment hash in the URL
    const hash = location.hash;
    if (hash && hash.startsWith('#comment-')) {
      const commentId = hash.replace('#comment-', '');
      // Scroll to comment after a short delay to ensure it's loaded
      setTimeout(() => {
        scrollToComment(commentId);
      }, 1000);
    }
  }, [location.hash, comments]);

  // Removed automatic scroll loading - using "View More Comments" button instead

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load post details
      const postData = await socialService.getPost(id!);
      setPost(postData);
      
      // Load initial comments (first page)
      await loadComments(true);
      
      // Load recent posts after main post is loaded
      loadRecentPosts();
      
    } catch (err) {
      console.error('Failed to load post:', err);
      setError('Failed to load post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (reset = false) => {
    if (isLoadingComments) return;

    console.log('🔄 Loading comments for post:', id, 'reset:', reset);
    
    setIsLoadingComments(true);
    try {
      const currentPage = reset ? 1 : commentsPage;
      const response = await socialService.getPostComments(id!, currentPage, COMMENTS_PER_PAGE);
      
      console.log('📝 Comment API response:', response);
      
      if (reset) {
        setComments(response);
        setCommentsPage(2);
      } else {
        setComments(prev => [...prev, ...response]);
        setCommentsPage(prev => prev + 1);
      }
      
      // Check if there are more comments
      setHasMoreComments(response.length === COMMENTS_PER_PAGE);
      
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadMoreComments = async () => {
    if (isLoadingMoreComments || !hasMoreComments) return;
    
    setIsLoadingMoreComments(true);
    try {
      await loadComments(false);
    } finally {
      setIsLoadingMoreComments(false);
    }
  };

  const loadNestedComments = async (commentId: string) => {
    if (nestedCommentsLoaded.has(commentId)) return;
    
    try {
      console.log('🔄 Loading nested comments for:', commentId);
      const response = await socialService.getNestedComments(commentId);
      
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, replies: response.comments };
        }
        return comment;
      }));
      
      setNestedCommentsLoaded(prev => {
        const newSet = new Set(prev);
        newSet.add(commentId);
        return newSet;
      });
    } catch (err) {
      console.error('Failed to load nested comments:', err);
    }
  };

  const loadRecentPosts = async () => {
    try {
      setLoadingRecentPosts(true);
      const response = await socialService.getPosts({ 
        page: 0, 
        limit: 5 
      }); // Get 5 recent posts
      setRecentPosts(response.posts);
    } catch (err) {
      console.error('Failed to load recent posts:', err);
    } finally {
      setLoadingRecentPosts(false);
    }
  };

  const scrollToComment = (commentId: string) => {
    console.log('🎯 Attempting to scroll to comment:', commentId);
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
      console.log('✅ Found comment element, scrolling...');
      commentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the comment temporarily
      commentElement.style.backgroundColor = '#fef3c7';
      commentElement.style.border = '2px solid #f59e0b';
      commentElement.style.borderRadius = '8px';
      commentElement.style.padding = '8px';
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        commentElement.style.backgroundColor = '';
        commentElement.style.border = '';
        commentElement.style.borderRadius = '';
        commentElement.style.padding = '';
      }, 3000);
    } else {
      console.log('❌ Comment element not found:', `comment-${commentId}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async () => {
    if (!post || isLiking) return;
    
    try {
      setIsLiking(true);
      if (post.isLiked) {
        await socialService.unlikePost(post.id);
        setPost(prev => prev ? { ...prev, isLiked: false, likesCount: prev.likesCount - 1 } : null);
      } else {
        await socialService.likePost(post.id);
        setPost(prev => prev ? { ...prev, isLiked: true, likesCount: prev.likesCount + 1 } : null);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (content: string) => {
    if (!post || !content.trim() || isCommenting) return;
    
    try {
      setIsCommenting(true);
      await socialService.createComment(post.id, content);
      
      // Reload comments to show the new one
      await loadComments(true);
      
      // Update post comment count
      setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
      
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleBackToFeed = () => {
    navigate('/social');
  };

  const handleBackToNotifications = () => {
    navigate('/notifications');
  };

  const handleGoBack = () => {
    // Check if user came from notifications or social feed
    const referrer = document.referrer;
    if (referrer.includes('/notifications')) {
      navigate('/notifications');
    } else if (referrer.includes('/social')) {
      navigate('/social');
    } else {
      // Default to social feed
      navigate('/social');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      // Toggle like state
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(commentId)) {
          newSet.delete(commentId);
        } else {
          newSet.add(commentId);
        }
        return newSet;
      });

      // Update comment likes count
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likesCount: likedComments.has(commentId) ? comment.likesCount - 1 : comment.likesCount + 1 }
          : comment
      ));

      // TODO: Call API to like/unlike comment
      console.log('Liked comment:', commentId);
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.author?.displayName || 'User'} `);
  };

  const handleExpandReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleCommentShare = (comment: Comment) => {
    const commentUrl = `${window.location.origin}/post/${post?.id}#comment-${comment.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'Check out this comment',
        url: commentUrl
      });
    } else {
      navigator.clipboard.writeText(commentUrl).then(() => {
        alert('Comment link copied to clipboard!');
      });
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isLiked = likedComments.has(comment.id);
    const isHighlighted = location.hash === `#comment-${comment.id}`;
    const hasNestedComments = comment.repliesCount > 0;
    const areNestedCommentsLoaded = nestedCommentsLoaded.has(comment.id);

    return (
      <div key={comment.id} className="comment-thread">
        <div 
          id={`comment-${comment.id}`}
          className={`comment-item bg-white rounded-2xl p-5 mb-4 border border-gray-100 hover:border-gray-200 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
            isHighlighted ? 'ring-4 ring-blue-400 bg-blue-50 border-blue-300 shadow-blue-200' : ''
          }`}
          style={{ 
            marginLeft: `${depth * 32}px`,
            borderLeft: depth > 0 ? '6px solid #e5e7eb' : 'none',
            paddingLeft: depth > 0 ? '24px' : '0',
            position: 'relative',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          {/* Thin vertical line for nested comments */}
          {depth > 0 && (
            <div 
              className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-300 via-purple-300 to-pink-300 rounded-full shadow-sm"
              style={{ left: '-3px' }}
            />
          )}

          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-3 ring-gray-100 shadow-lg">
                {comment.author?.avatarUrl ? (
                  <img 
                    src={comment.author.avatarUrl} 
                    alt={comment.author.displayName || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {comment.author?.displayName?.charAt(0) || comment.author?.username?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-gray-900 text-lg">
                    {comment.author?.displayName || comment.author?.username || 'Unknown User'}
                  </span>
                  {comment.author?.username === 'grok.xai' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                      🤖 AI
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {comment.author?.username && comment.author.username !== 'grok.xai' && (
                    <span className="text-sm text-gray-600 font-medium">@{comment.author.username}</span>
                  )}
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 font-medium">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* More Options */}
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Comment Content */}
          <div className="mb-5 ml-20">
            <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap font-medium">
              {comment.content}
            </p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-8 text-sm ml-20">
            <button
              onClick={() => handleCommentLike(comment.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isLiked 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{comment.likesCount || 0}</span>
            </button>

            <button
              onClick={() => handleReply(comment)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">Reply</span>
            </button>

            <button
              onClick={() => handleCommentShare(comment)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
            >
              <Share2 className="w-4 h-4" />
              <span className="font-medium">Share</span>
            </button>
          </div>

          {/* View Comments Button for Nested Comments */}
          {hasNestedComments && !areNestedCommentsLoaded && (
            <div className="mt-4 pt-4 border-t border-gray-100 ml-20">
              <button
                onClick={() => loadNestedComments(comment.id)}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>View {comment.repliesCount} replies</span>
              </button>
            </div>
          )}

          {/* Show/Hide Replies Button for Loaded Nested Comments */}
          {hasReplies && areNestedCommentsLoaded && (
            <div className="mt-4 pt-4 border-t border-gray-100 ml-20">
              <button
                onClick={() => handleExpandReplies(comment.id)}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Hide {comment.replies?.length || 0} replies</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Show {comment.repliesCount} replies</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Nested Replies - Only show if expanded and loaded */}
        {isExpanded && hasReplies && areNestedCommentsLoaded && (
          <div className="nested-comments">
            {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Post</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-yellow-500 text-5xl mb-4">🤔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Post Not Found</h2>
          <p className="text-gray-600 mb-4">The post you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Navigation Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToFeed}
                className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                <Home className="w-4 h-4" />
                <span className="font-medium">Feed</span>
              </button>
              
              <button
                onClick={handleBackToNotifications}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm"
              >
                <Bell className="w-4 h-4" />
                <span className="font-medium">Notifications</span>
              </button>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <img 
              src={post.author?.avatarUrl || '/default-avatar.png'} 
              alt={post.author?.displayName || 'Unknown User'}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{post.author?.displayName || 'Unknown User'}</h3>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-500 text-sm">{formatDate(post.createdAt)}</span>
              </div>
              <div className="mt-2">
                <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
              </div>
              <div className="flex items-center space-x-6 mt-4">
                <button 
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center space-x-2 transition-colors ${
                    post.isLiked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-gray-500 hover:text-red-500'
                  } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-xl">{post.isLiked ? '❤️' : '🤍'}</span>
                  <span>{post.likesCount}</span>
                  {isLiking && <span className="text-sm">...</span>}
                </button>
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 cursor-pointer"
                >
                  <span className="text-xl">💬</span>
                  <span>{post.commentsCount}</span>
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-gray-500 hover:text-green-500 cursor-pointer"
                >
                  <span className="text-xl">📤</span>
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Comments ({comments.length})
              </h3>
              <button 
                onClick={() => setShowComments(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Comment Composer */}
            <div className="mb-6">
              {replyingTo && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-600">Replying to:</span>
                      <span className="text-sm font-medium text-blue-800">
                        {replyingTo.author?.displayName || 'User'}
                      </span>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              <div className="flex space-x-3">
                <img 
                  src="/default-avatar.png" 
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? `Reply to ${replyingTo.author?.displayName || 'User'}...` : "Write a comment..."}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    maxLength={280}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (newComment.includes('@grok')) {
                            setNewComment(newComment + ' ');
                          } else {
                            setNewComment(newComment + '@grok ');
                          }
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
                        🤖 @grok
                      </button>
                      <span className="text-xs text-gray-500">
                        {newComment.length}/280
                      </span>
                    </div>
                    <button
                      onClick={() => handleComment(newComment)}
                      disabled={!newComment.trim() || isCommenting}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCommenting ? 'Posting...' : replyingTo ? 'Reply' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              <>
                <div className="space-y-4">
                  {comments.map((comment) => renderComment(comment))}
                </div>
                
                {/* Load More Comments Button */}
                {hasMoreComments && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreComments}
                      disabled={isLoadingMoreComments}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isLoadingMoreComments ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        `View More Comments (${post?.commentsCount || 0 - comments.length} remaining)`
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Recent Posts Section - Below Main Content */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
              <button
                onClick={handleBackToFeed}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View All
              </button>
            </div>
            
            {loadingRecentPosts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentPosts
                  .filter(p => p.id !== post?.id) // Exclude current post
                  .slice(0, 6) // Show max 6 posts
                  .map((recentPost) => (
                    <div 
                      key={recentPost.id}
                      onClick={() => navigate(`/post/${recentPost.id}`)}
                      className="cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors border border-gray-100"
                    >
                      <div className="flex items-start space-x-3">
                        <img 
                          src={recentPost.author?.avatarUrl || '/default-avatar.png'} 
                          alt={recentPost.author?.displayName || 'Unknown User'}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {recentPost.author?.displayName || 'Unknown User'}
                            </h4>
                            <span className="text-gray-500 text-sm">•</span>
                            <span className="text-gray-500 text-sm">
                              {formatDate(recentPost.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mt-1 line-clamp-2">
                            {recentPost.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>❤️ {recentPost.likesCount}</span>
                            <span>💬 {recentPost.commentsCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📝</div>
                <p className="text-gray-500 text-sm">No recent posts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleBackToNotifications}
              className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-200"
              title="Back to Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={handleBackToFeed}
              className="bg-white text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
              title="Back to Feed"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;