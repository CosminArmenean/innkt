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
        setPosts(response.posts || []);
      } else {
        setPosts(prev => [...prev, ...(response.posts || [])]);
      }
      
      setHasMore(response.hasMore || false);
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
    console.log('New post created, adding to feed:', newPost);
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
      // TODO: Implement share functionality when backend endpoint is available
      console.log('Share functionality not yet implemented in backend');
      
      // For now, just show a success message
      alert('Share functionality coming soon!');
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await socialService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
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
    <div className="max-w-7xl mx-auto">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {groupId ? 'Group Posts' : userId ? 'User Posts' : 'Social Feed'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Stay connected with your community
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>
        </div>

        {/* Professional Filters */}
        {showFilters && (
          <div className="px-6 pb-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => loadPosts(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Professional Post Creation */}
      {showPostCreation && (
        <div className="bg-white border-b border-gray-200">
          <div className="p-8">
            <PostCreation
              onPostCreated={handlePostCreated}
              groupId={groupId}
            />
          </div>
        </div>
      )}

      {/* Professional Posts Feed */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto py-8 space-y-8">
          {sortedPosts.length === 0 && !isLoading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {showPostCreation 
                  ? "Be the first to share something with your community!" 
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
                  onLike={handleLike}
                  onShare={handleShare}
                  onDelete={handleDelete}
                  currentUserId={currentUserId || '4f8c8759-dfdc-423e-878e-c68036140114'}
                />
              ))}

              {/* Regular Posts */}
              {sortedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onShare={handleShare}
                  onDelete={handleDelete}
                  currentUserId={currentUserId || undefined}
                  formatDate={formatDate}
                  getPostVisibilityIcon={getPostVisibilityIcon}
                  getPostTypeIcon={getPostTypeIcon}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-8">
                  <button
                    onClick={() => loadPosts(false)}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      'Load More Posts'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Professional Post Card Component
const PostCard: React.FC<{
  post: Post;
  onLike: (postId: string) => void;
  onShare: (postId: string) => void;
  onDelete: (postId: string) => void;
  currentUserId?: string;
  formatDate: (date: string) => string;
  getPostVisibilityIcon: (visibility: string) => string;
  getPostTypeIcon: (type: string) => string;
}> = ({ post, onLike, onShare, onDelete, currentUserId, formatDate, getPostVisibilityIcon, getPostTypeIcon }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

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
      onDelete(post.id);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const isOwnPost = currentUserId && post.authorProfile?.id === currentUserId;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Professional Post Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
              {post.authorProfile?.avatar || post.author?.avatarUrl ? (
                <img 
                  src={post.authorProfile?.avatar || post.author?.avatarUrl} 
                  alt={post.authorProfile?.displayName || post.author?.displayName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {(post.authorProfile?.displayName || post.author?.displayName || `User ${post.userId?.substring(0, 8) || 'Unknown'}`).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {post.authorProfile?.displayName || post.author?.displayName || `User ${post.userId?.substring(0, 8) || 'Unknown'}`}
                </h3>
                {(post.authorProfile?.isVerified || post.author?.isVerified) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {(post.authorProfile?.isKidAccount || post.author?.isKidAccount) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    👶 Kid Account
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">
                  @{post.authorProfile?.username || post.author?.username || 'unknown'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500 flex items-center">
                  {getPostVisibilityIcon(post.visibility)} {post.visibility}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500 flex items-center">
                  {getPostTypeIcon(post.type)} {post.type}
                </span>
              </div>
            </div>
          </div>

          {/* Post Actions Menu */}
          <div className="flex items-center space-x-2">
            {isOwnPost && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Edit post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Professional Post Content */}
      <div className="px-6 py-4">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isSaving || !editContent.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Media Content */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mt-4">
            <div className="grid grid-cols-1 gap-2">
              {post.mediaUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Post media ${index + 1}`}
                    className="w-full h-auto rounded-lg object-cover max-h-96"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {post.location && post.location.name && (
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {post.location.name}
          </div>
        )}
      </div>

      {/* Professional Engagement Bar */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                post.isLiked 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <svg className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm font-medium">{post.likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{post.commentsCount}</span>
            </button>

            <button
              onClick={() => onShare(post.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                post.isShared 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm font-medium">{post.sharesCount}</span>
            </button>
          </div>

          <div className="text-sm text-gray-500">
            {post.viewsCount && post.viewsCount > 0 && `${post.viewsCount} views`}
          </div>
        </div>
      </div>

      {/* Professional Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100">
          <div className="px-6 py-4">
            {/* Comment Input */}
            <div className="flex space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleCommentSubmit}
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;