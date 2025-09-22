import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { socialService, Post, UserProfile } from '../../services/social.service';
import { feedService, FeedItem } from '../../services/feed.service';
import { realtimeService, PostEvent, PollEvent } from '../../services/realtime.service';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import PostCreation from './PostCreation';
import LinkedAccountsPost from './LinkedAccountsPost';
import PostSkeleton from './PostSkeleton';
import RepostButton from './RepostButton';
import RepostCard from './RepostCard';
import { useAuth } from '../../contexts/AuthContext';
import CommentFloatingCard from './CommentFloatingCard';

// Add CSS for notification animations
const notificationStyles = `
  @keyframes slide-down {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes expand-post-creation {
    from {
      opacity: 0;
      transform: scale(0.95);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: scale(1);
      max-height: 1000px;
    }
  }
  
  @keyframes collapse-post-creation {
    from {
      opacity: 1;
      transform: scale(1);
      max-height: 1000px;
    }
    to {
      opacity: 0;
      transform: scale(0.95);
      max-height: 0;
    }
  }
  
  .animate-slide-down {
    animation: slide-down 0.4s ease-out;
  }
  
  .animate-expand {
    animation: expand-post-creation 0.5s ease-out;
  }
  
  .animate-collapse {
    animation: collapse-post-creation 0.3s ease-in;
  }
  
  /* Overlapping profile pictures effect */
  .profile-stack {
    position: relative;
  }
  
  .profile-stack > div:not(:first-child) {
    margin-left: -8px;
  }
  
  .profile-stack > div {
    transition: transform 0.2s ease;
  }
  
  .profile-stack:hover > div {
    transform: translateX(4px);
  }
  
  /* Post creation button hover effects */
  .post-creation-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .post-creation-button:hover {
    box-shadow: 0 10px 25px -5px rgba(147, 51, 234, 0.2);
  }

  /* Floating card popover animations */
  @keyframes popover-appear {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes backdrop-appear {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .popover-card {
    animation: popover-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .backdrop-overlay {
    animation: backdrop-appear 0.2s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = notificationStyles;
  document.head.appendChild(styleSheet);
}

interface SocialFeedProps {
  groupId?: string;
  userId?: string;
  showPostCreation?: boolean;
  linkedAccounts?: any[];
  currentUserId?: string;
  initialPostCreationExpanded?: boolean; // Allow parent to control initial state
}

// Helper function to convert relative avatar URLs to full URLs
const convertToFullAvatarUrl = (avatarUrl?: string): string | undefined => {
  if (!avatarUrl) return undefined;
  
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  if (avatarUrl.startsWith('/')) {
    const fullUrl = `http://localhost:5001${avatarUrl}`;
    console.log(`🔗 Converting avatar URL: ${avatarUrl} → ${fullUrl}`);
    return fullUrl;
  }
  
  return avatarUrl;
};

const SocialFeed: React.FC<SocialFeedProps> = ({ 
  groupId, 
  userId, 
  showPostCreation = true,
  linkedAccounts = [],
  currentUserId,
  initialPostCreationExpanded = false
}) => {
  const { user } = useAuth(); // Get current user information
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [linkedPosts, setLinkedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [filter, setFilter] = useState<'all' | 'verified' | 'blockchain' | 'ai-processed'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [isPostCreationExpanded, setIsPostCreationExpanded] = useState(initialPostCreationExpanded);
  const [error, setError] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [expandedRecentPost, setExpandedRecentPost] = useState<string | null>(null);
  const [showFullRecentPost, setShowFullRecentPost] = useState<string | null>(null);
  const { notifications, addNotification, removeNotification } = useRealtimeNotifications();
  const [sseStatus, setSseStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [showCommentCard, setShowCommentCard] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [commentCardPosition, setCommentCardPosition] = useState({ top: 0, left: 0 });

  // Infinite scroll detection
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '300px', // Start loading 300px before reaching bottom (X-style)
  });

  useEffect(() => {
    // Prevent duplicate initial loads
    if (!hasInitialized) {
      setHasInitialized(true);
    loadPosts(true);
    loadLinkedPosts();
      loadRecentPosts();
    } else {
      // Only reload if filters actually changed after initialization
      loadPosts(true);
      loadLinkedPosts();
    }
  }, [groupId, userId, filter, sortBy]);

  // Infinite scroll trigger - X-style automatic loading
  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore) {
      console.log('🚀 Infinite scroll triggered - loading more posts...');
      loadMorePosts();
    }
  }, [inView, hasMore, isLoading, isLoadingMore]);

  // Real-time SSE integration
  useEffect(() => {
    console.log('🚀 Setting up SSE connection for real-time updates...');
    setSseStatus('connecting');
    
    // Connect to SSE
    realtimeService.connect()
      .then(() => {
        console.log('✅ SSE connected - real-time updates active!');
        setSseStatus('connected');
      })
      .catch(error => {
        console.error('❌ Failed to connect to SSE:', error);
        setSseStatus('error');
      });

    // Handle new posts from Change Streams
    const handleNewPost = (eventData: any) => {
      console.log('📬 Received new post via SSE:', eventData);
      console.log('🔍 DEBUG - Full event data structure:', JSON.stringify(eventData, null, 2));
      console.log('🔍 DEBUG - Author profile data:', eventData.authorProfile);
      console.log('🔍 DEBUG - Avatar URL:', eventData.authorProfile?.avatarUrl);
      
      // The eventData IS the data object (not nested under event.data)
      // Validate event data
      if (!eventData || !eventData.postId) {
        console.warn('Invalid new post event data:', eventData);
        return;
      }
      
      // Add new post to the top of the feed
      setPosts(prevPosts => {
        // Check if post already exists to avoid duplicates
        const postExists = prevPosts.some(p => p.id === eventData.postId);
        if (postExists) {
          return prevPosts;
        }

        // Create a temporary post object (will be replaced when feed refreshes)
        const newPost: Post = {
          id: eventData.postId,
          userId: eventData.authorId,
          content: eventData.content || 'New post...',
          postType: eventData.postType as any || 'text',
          visibility: 'public',
          mediaUrls: [],
          hashtags: [],
          mentions: [],
          tags: [],
          isPublic: true,
          isPinned: false,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          isLiked: false,
          isShared: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorProfile: undefined // Will be populated by next feed refresh
        };

        return [newPost, ...prevPosts];
      });

      // Show notification
      console.log('🎉 New post added to feed in real-time!');
      console.log('🔍 DEBUG - Creating notification with data:', eventData);
      
      addNotification({
        type: 'new_post',
        title: '📬 New Post',
        message: eventData.authorProfile?.displayName 
          ? `New post from ${eventData.authorProfile.displayName}`
          : `New post from ${eventData.authorId}`,
        data: eventData
      });
    };

    // Handle post updates (likes, comments)
    const handlePostUpdated = (eventData: any) => {
      console.log('🔄 Post updated via SSE:', eventData);
      
      // Validate event data
      if (!eventData || !eventData.postId) {
        console.warn('Invalid post update event data:', eventData);
        return;
      }
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === eventData.postId 
            ? {
                ...post,
                likesCount: eventData.likesCount ?? post.likesCount,
                commentsCount: eventData.commentsCount ?? post.commentsCount
              }
            : post
        )
      );
    };

    // Handle poll votes
    const handlePollVoted = (eventData: any) => {
      console.log('🗳️ Poll voted via SSE:', eventData);
      
      // Validate event data
      if (!eventData || !eventData.postId) {
        console.warn('Invalid poll vote event data:', eventData);
        return;
      }
      
      // Refresh poll results for the specific post
      // This will trigger a re-render of the poll component
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === eventData.postId 
            ? { ...post, updatedAt: new Date().toISOString() }
            : post
        )
      );
    };

    // Subscribe to events
    realtimeService.onNewPost(handleNewPost);
    realtimeService.onPostUpdated(handlePostUpdated);
    realtimeService.onPollVoted(handlePollVoted);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up SSE connection...');
      realtimeService.disconnect();
    };
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        if (hasMore && !isLoading) {
          loadPosts(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, page]);

  const loadPosts = async (reset = false) => {
    if ((isLoading || isLoadingMore) && !reset) return;

    try {
    if (reset) {
        setIsLoading(true);
        setError(null);
      setPage(1);
      setPosts([]);
        console.log(`🔄 Initial load - Filter: ${filter}, SortBy: ${sortBy}`);
      } else {
        setIsLoadingMore(true);
        console.log(`📚 Infinite scroll loading - Page: ${page}`);
    }

      // X-style batch sizes: 15 initial, 10 for subsequent loads
      const batchSize = reset ? 15 : 10;
      
      // Load unified feed with posts and reposts
      const response = await feedService.getUnifiedFeed({
        groupId,
        userId,
        page: reset ? 1 : page,
        limit: batchSize,
        includeReposts: true // Enable reposts in feed
      });

      console.log(`🚀 Unified Feed: Loaded ${response.items?.length || 0} items (Page ${reset ? 1 : page})`);

      if (reset) {
        // Separate posts and feed items
        const posts = response.items.filter(item => item.type === 'post').map(item => item.post!);
        setPosts(posts);
        setFeedItems(response.items);
        setPage(2); // Next page will be 2
      } else {
        // Prevent duplicate items by checking IDs
        setFeedItems(prev => {
          const newItems = response.items || [];
          const existingIds = new Set(prev.map(item => item.id));
          const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
          
          if (uniqueNewItems.length < newItems.length) {
            console.log(`🔍 Filtered out ${newItems.length - uniqueNewItems.length} duplicate feed items`);
          }
          
          return [...prev, ...uniqueNewItems];
        });
        
        // Also update posts array for backward compatibility
        const newPosts = response.items.filter(item => item.type === 'post').map(item => item.post!);
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
        
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.hasMore || false);
      
      if (!response.hasMore) {
        console.log('📄 End of feed reached - no more posts to load');
      }
    } catch (error) {
      console.error('❌ Failed to load posts:', error);
      setError(reset ? 'Failed to load posts' : 'Failed to load more posts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Separate function for infinite scroll loading
  const loadMorePosts = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) return;
    
    console.log('🔄 Infinite scroll: Loading next batch...');
    await loadPosts(false);
  }, [hasMore, isLoading, isLoadingMore, page]);

  // Memory management - X-style DOM optimization
  useEffect(() => {
    const MAX_POSTS_IN_DOM = 500; // X-style limit to prevent DOM bloat
    
    if (posts.length > MAX_POSTS_IN_DOM) {
      console.log(`🧹 Memory management: Removing old posts (${posts.length} -> ${MAX_POSTS_IN_DOM})`);
      setPosts(prev => prev.slice(0, MAX_POSTS_IN_DOM));
    }
  }, [posts.length]);

  const loadLinkedPosts = () => {
    // TODO: Implement linked posts API endpoint
    // For now, return empty array
    setLinkedPosts([]);
  };

  const loadRecentPosts = async () => {
    try {
      const response = await socialService.getPosts({ limit: 6 });
      setRecentPosts(response.posts || []);
    } catch (error) {
      console.error('Failed to load recent posts:', error);
      setRecentPosts([]);
    }
  };

  const handleRecentPostClick = (postId: string) => {
    if (expandedRecentPost === postId) {
      // Close the card
      setExpandedRecentPost(null);
      setShowFullRecentPost(null);
    } else {
      // Open the card and increment view count
      setExpandedRecentPost(postId);
      setShowFullRecentPost(null);
      
      // Increment view count (simulate API call)
      setRecentPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, viewsCount: (post.viewsCount || 0) + 1 }
          : post
      ));
      
      console.log(`👁️ Post view incremented for post ${postId}`);
    }
  };

  const handleReadMore = (postId: string) => {
    setShowFullRecentPost(postId);
  };

  const handleProfileClick = (userId: string) => {
    // Navigate to user profile (re-enabled for floating card username)
    window.location.href = `/profile/${userId}`;
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handlePostCreated = (newPost: Post) => {
    console.log('New post created, adding to feed:', newPost);
    setPosts(prev => [newPost, ...prev]);
    // Auto-collapse post creation after successful post
    setIsPostCreationExpanded(false);
  };

  const togglePostCreation = () => {
    setIsPostCreationExpanded(!isPostCreationExpanded);
  };

  // Keyboard support for post creation toggle
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + N to toggle post creation
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
        event.preventDefault();
        if (showPostCreation) {
          setIsPostCreationExpanded(!isPostCreationExpanded);
        }
      }
      // Escape to collapse post creation
      if (event.key === 'Escape' && isPostCreationExpanded) {
        setIsPostCreationExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showPostCreation, isPostCreationExpanded]);

  const handleNotificationClick = (notification: any) => {
    console.log('🔔 Notification clicked, refreshing feed...', notification);
    
    // Remove the notification
    removeNotification(notification.id);
    
    // Refresh the feed to show new posts
    loadPosts(true);
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

  const handleCommentClick = (post: Post, event: React.MouseEvent) => {
    // Close any existing comment card first
    if (showCommentCard) {
      setShowCommentCard(false);
      setSelectedPostForComments(null);
    }
    
    // Get the position of the comment button
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const position = {
      top: buttonRect.bottom + 10, // Position below the button
      left: Math.min(buttonRect.left, window.innerWidth - 600) // Ensure it fits on screen
    };
    
    setCommentCardPosition(position);
    setSelectedPostForComments(post);
    setShowCommentCard(true);
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
      {/* Real-time Notifications - Top-Middle under navbar */}
      {notifications.length > 0 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-green-500 text-white px-3 py-2 rounded-full shadow-lg animate-slide-down cursor-pointer hover:bg-green-600 transition-colors"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-center space-x-3">
                {/* Overlapping Profile Pictures (X/Twitter style) */}
                <div className="flex items-center">
                  {notification.authors && notification.authors.length > 0 ? (
                    <div className="flex -space-x-2 profile-stack">
                      {notification.authors.slice(0, 3).map((author, index) => (
                        <div
                          key={author.userId}
                          className="w-7 h-7 rounded-full border-2 border-white bg-white flex items-center justify-center"
                          style={{ zIndex: 10 - index }}
                        >
                          {author.avatarUrl ? (
                            <img 
                              src={convertToFullAvatarUrl(author.avatarUrl)} 
                              alt={author.displayName}
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                // Fallback if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          
                          {/* Fallback avatar (always present, hidden if image loads) */}
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ${author.avatarUrl ? 'hidden' : ''}`}>
                            <span className="text-xs text-white font-bold">
                              {author.displayName?.[0]?.toUpperCase() || 
                               author.username?.[0]?.toUpperCase() || 
                               '👤'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {notification.authors.length > 3 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-600 flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            +{notification.authors.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <span className="text-sm">
                        {notification.type === 'new_post' && '📬'}
                        {notification.type === 'post_liked' && '❤️'}
                        {notification.type === 'poll_voted' && '🗳️'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Notification Text */}
                <div className="flex items-center space-x-1">
                  <span className="text-xs opacity-80">
                    {notification.type === 'new_post' && '📬'}
                    {notification.type === 'post_liked' && '❤️'}
                    {notification.type === 'poll_voted' && '🗳️'}
                  </span>
                  <span className="text-sm font-medium">
                    {notification.message}
                  </span>
                  {notification.count && notification.count > 1 && (
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                      {notification.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Professional Header */}
      {/* Thin Header Row */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              🎯 {groupId ? 'Group Square' : userId ? 'User Square' : 'Social Square'}
              </h1>
            
              <button
                onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
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

      {/* Recent Posts Row - Styled like Add New Post */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-dashed border-purple-200 rounded-xl p-4">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <div key={post.id} className="flex-shrink-0 relative">
                    <button
                      onClick={() => handleRecentPostClick(post.id)}
                      className="w-14 h-14 rounded-full overflow-hidden border-3 border-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      title={post.authorProfile?.username || 'User'}
                    >
                      <img
                        src={post.authorProfile?.avatar || '/api/placeholder/56/56'}
                        alt={post.authorProfile?.username || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    
                    {/* Floating Card Popover - Fixed positioning to appear over container */}
                    {expandedRecentPost === post.id && (
                      <>
                        {/* Backdrop overlay */}
                        <div 
                          className="fixed inset-0 z-40 bg-black bg-opacity-20 backdrop-overlay"
                          onClick={() => setExpandedRecentPost(null)}
                        />
                        
                        {/* Floating card positioned over everything */}
                        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 popover-card">
                          {/* Profile Header with clickable username */}
                          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
                            <img
                              src={post.authorProfile?.avatar || '/api/placeholder/48/48'}
                              alt={post.authorProfile?.username || 'User'}
                              className="w-12 h-12 rounded-full border-2 border-gray-200"
                            />
                            <div className="flex-1">
                              <button
                                onClick={() => handleProfileClick(post.userId)}
                                className="text-left hover:bg-gray-50 rounded-lg p-1 transition-colors"
                              >
                                <h4 className="text-base font-semibold text-gray-900 hover:text-purple-600">{post.authorProfile?.displayName || 'Unknown User'}</h4>
                                <p className="text-sm text-gray-500">@{post.authorProfile?.username || 'unknown'}</p>
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRecentPost(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          
                          {/* Post Content */}
                          <div className="text-sm text-gray-700 mb-4">
                            {showFullRecentPost === post.id ? (
                              <p className="leading-relaxed">{post.content}</p>
                            ) : (
                              <p className="leading-relaxed">{truncateText(post.content)}</p>
                            )}
                            
                            {post.content.length > 120 && showFullRecentPost !== post.id && (
                              <button
                                onClick={() => handleReadMore(post.id)}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-2"
                              >
                                Read more
                              </button>
                            )}
                          </div>
                          
                          {/* Post Media */}
                          {post.media && post.media.length > 0 && (
                            <img
                              src={post.media[0].url}
                              alt={post.media[0].altText || 'Post media'}
                              className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                          )}
                          
                          {/* Engagement Stats */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <button 
                                onClick={() => handleLike(post.id)}
                                className="flex items-center space-x-2 hover:text-red-500 cursor-pointer transition-colors"
                              >
                                <span>{post.isLiked ? '❤️' : '🤍'}</span>
                                <span>{post.likesCount}</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setExpandedRecentPost(null);
                                  // Scroll to the post in the main feed to open comments
                                  const postElement = document.querySelector(`[data-post-id="${post.id}"]`);
                                  if (postElement) {
                                    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    // Trigger comment section open
                                    setTimeout(() => {
                                      const commentButton = postElement.querySelector('[data-comment-button]') as HTMLElement;
                                      if (commentButton) {
                                        commentButton.click();
                                      }
                                    }, 500);
                                  }
                                }}
                                className="flex items-center space-x-2 hover:text-blue-500 cursor-pointer transition-colors"
                              >
                                <span>💬</span>
                                <span>{post.commentsCount}</span>
                              </button>
                              <button 
                                onClick={() => handleShare(post.id)}
                                className="flex items-center space-x-2 hover:text-green-500 cursor-pointer transition-colors"
                              >
                                <span>📤</span>
                                <span>{post.sharesCount}</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setExpandedRecentPost(null);
                                  // Open repost modal for this post
                                  const repostButton = document.querySelector(`[data-post-id="${post.id}"] [data-repost-button]`) as HTMLElement;
                                  if (repostButton) {
                                    repostButton.click();
                                  }
                                }}
                                className="flex items-center space-x-2 hover:text-purple-500 cursor-pointer transition-colors"
                              >
                                <span>🔄</span>
                                <span>Repost</span>
                              </button>
                              <span className="flex items-center space-x-2 text-gray-400">
                                <span>👁️</span>
                                <span>{post.viewsCount || 0}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Loading recent posts...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Post Creation with Toggle */}
      {showPostCreation && (
        <div className="bg-white border-b border-gray-200">
          <div className="p-6">
            {!isPostCreationExpanded ? (
              /* Cool "Add New Post" Button - Collapsed State */
              <div 
                onClick={togglePostCreation}
                className="group cursor-pointer bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-2 border-dashed border-purple-200 hover:border-purple-300 rounded-xl p-6 post-creation-button relative"
                title="Click to create a new post (Ctrl+Shift+N)"
              >
                <div className="flex items-center space-x-4">
                  {/* User Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  
                  {/* Call to Action */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                      ✨ Add New Post
                    </h3>
                    <p className="text-gray-500 group-hover:text-gray-600 transition-colors">
                      Share what's on your mind with your community...
                    </p>
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-1 bg-white rounded-full px-3 py-1 shadow-sm">
                      <span className="text-purple-600 text-sm">📝</span>
                      <span className="text-xs text-gray-600">Text</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white rounded-full px-3 py-1 shadow-sm">
                      <span className="text-green-600 text-sm">📷</span>
                      <span className="text-xs text-gray-600">Image</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white rounded-full px-3 py-1 shadow-sm">
                      <span className="text-blue-600 text-sm">📊</span>
                      <span className="text-xs text-gray-600">Poll</span>
                    </div>
                  </div>
                  
                  {/* Expand Arrow */}
                  <div className="text-purple-400 group-hover:text-purple-600 transition-colors">
                    <svg className="w-5 h-5 transform group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Post Creation - Expanded State */
              <div className="relative">
                {/* Close Button */}
                <button
                  onClick={togglePostCreation}
                  className="absolute top-0 right-0 z-10 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full p-2 shadow-lg transition-all duration-200 transform hover:scale-110"
                  title="Collapse post creation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Expanded Post Creation */}
                <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl border border-purple-100 p-6 shadow-sm animate-expand">
            <PostCreation
              onPostCreated={handlePostCreated}
              groupId={groupId}
            />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Posts Feed */}
      <div className="bg-transparent">
        <div className="py-8 space-y-8">
          {/* Initial Loading State */}
          {isLoading && posts.length === 0 ? (
            <div className="space-y-8">
              <PostSkeleton count={5} />
            </div>
          ) : sortedPosts.length === 0 ? (
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

              {/* Unified Feed - Posts and Reposts */}
              {feedItems.map((item) => (
                item.type === 'post' ? (
                  <PostCard
                    key={item.id}
                    post={item.post!}
                    onLike={handleLike}
                    onShare={handleShare}
                    onDelete={handleDelete}
                    onComment={handleCommentClick}
                    currentUserId={currentUserId || undefined}
                    formatDate={formatDate}
                    getPostVisibilityIcon={getPostVisibilityIcon}
                    getPostTypeIcon={getPostTypeIcon}
                    currentUser={user}
                  />
                ) : (
                  <RepostCard
                    key={item.id}
                    repost={item.repost!}
                    onLike={(repostId) => {
                      console.log('❤️ Liked repost:', repostId);
                      // Update local state
                      setFeedItems(prev => prev.map(feedItem => 
                        feedItem.id === item.id && feedItem.repost
                          ? { ...feedItem, repost: { ...feedItem.repost, likesCount: feedItem.repost.likesCount + 1 } }
                          : feedItem
                      ));
                    }}
                    onComment={(repostId) => {
                      console.log('💬 Comment on repost:', repostId);
                      // TODO: Implement repost commenting
                    }}
                    onShare={(repostId) => {
                      console.log('🔄 Share repost:', repostId);
                      // TODO: Implement repost sharing
                    }}
                    onDelete={async (repostId) => {
                      console.log('🗑️ Delete repost:', repostId);
                      try {
                        const success = await feedService.deleteRepost(repostId);
                        if (success) {
                          // Remove from feed
                          setFeedItems(prev => prev.filter(feedItem => feedItem.id !== item.id));
                        }
                      } catch (error) {
                        console.error('Failed to delete repost:', error);
                      }
                    }}
                    currentUserId={currentUserId}
                    formatDate={formatDate}
                  />
                )
              ))}

              {/* Fallback: Regular Posts (if feedItems is empty) */}
              {feedItems.length === 0 && sortedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onShare={handleShare}
                  onDelete={handleDelete}
                  onComment={handleCommentClick}
                  currentUserId={currentUserId || undefined}
                  formatDate={formatDate}
                  getPostVisibilityIcon={getPostVisibilityIcon}
                  getPostTypeIcon={getPostTypeIcon}
                  currentUser={user}
                />
              ))}

              {/* Infinite Scroll Loading States */}
              {isLoadingMore && (
                <div className="py-8">
                  <PostSkeleton count={3} />
                </div>
              )}
              
              {/* Infinite Scroll Trigger (Invisible) */}
              {hasMore && !isLoadingMore && (
                <div 
                  ref={loadMoreRef}
                  className="h-20 flex items-center justify-center"
                >
                  <div className="text-gray-400 text-sm animate-pulse">
                    📚 Loading more posts...
                  </div>
                </div>
              )}
              
              {/* End of Feed Message */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">🎉 You're all caught up!</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    You've seen all the latest posts. Check back later for new content, or create your own post to share with the community!
                  </p>
                  <button
                    onClick={togglePostCreation}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    Create New Post
                  </button>
                </div>
              )}
              
              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">❌ Something went wrong</h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      loadPosts(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Comment Card */}
      {selectedPostForComments && (
        <CommentFloatingCard
          post={selectedPostForComments}
          isOpen={showCommentCard}
          onClose={() => {
            setShowCommentCard(false);
            setSelectedPostForComments(null);
          }}
          position={commentCardPosition}
        />
      )}
    </div>
  );
};

// Professional Post Card Component
const PostCard: React.FC<{
  post: Post;
  onLike: (postId: string) => void;
  onShare: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (post: Post, event: React.MouseEvent) => void;
  currentUserId?: string;
  formatDate: (date: string) => string;
  getPostVisibilityIcon: (visibility: string) => string;
  getPostTypeIcon: (type: string) => string;
  currentUser?: any; // Add current user information
}> = ({ post, onLike, onShare, onDelete, onComment, currentUserId, formatDate, getPostVisibilityIcon, getPostTypeIcon, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  
  // Poll state
  const [pollResults, setPollResults] = useState<any>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userVote, setUserVote] = useState<number | null>(null);


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

  // Poll functions
  const loadPollResults = async () => {
    if (post.postType !== 'poll') return;
    
    try {
      const results = await socialService.getPollResults(post.id);
      setPollResults(results);
      setUserVote(results.userVotedOptionIndex ?? null);
    } catch (error) {
      console.error('Failed to load poll results:', error);
    }
  };

  const handleVote = async (option: string, optionIndex: number) => {
    if (!currentUserId || isVoting) return;
    
    setIsVoting(true);
    try {
      await socialService.voteOnPoll(post.id, option, optionIndex);
      setUserVote(optionIndex);
      // Reload poll results to get updated percentages
      await loadPollResults();
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to record your vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  // Load poll results when component mounts if it's a poll
  useEffect(() => {
    if (post.postType === 'poll') {
      loadPollResults();
    }
  }, [post.id, post.postType]);

  const isOwnPost = currentUserId && post.authorProfile?.id === currentUserId;

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      data-post-id={post.id}
    >
      {/* Professional Post Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
              {post.authorProfile?.avatar || post.author?.avatarUrl ? (
                <img 
                  src={convertToFullAvatarUrl(post.authorProfile?.avatar || post.author?.avatarUrl)} 
                  alt={post.authorProfile?.displayName || post.author?.displayName || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const originalUrl = post.authorProfile?.avatar || post.author?.avatarUrl;
                    const convertedUrl = convertToFullAvatarUrl(originalUrl);
                    console.log('Feed avatar image failed to load:', originalUrl, '→', convertedUrl);
                    e.currentTarget.style.display = 'none';
                  }}
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
                  {getPostTypeIcon(post.postType)} {post.postType}
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

        {/* Poll Display */}
        {post.postType === 'poll' && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">
              🐛 Debug: PostType = "{post.postType}", PollOptions = {JSON.stringify(post.pollOptions)}
            </div>
            
            {post.pollOptions && post.pollOptions.length > 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    📊 Poll
                  </h4>
                  {post.pollExpiresAt && (
                    <span className="text-sm text-gray-500 flex items-center">
                      ⏰ {new Date(post.pollExpiresAt) > new Date() 
                        ? `Expires ${new Date(post.pollExpiresAt).toLocaleDateString()}`
                        : 'Expired'
                      }
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {post.pollOptions.map((option, index) => {
                    const result = pollResults?.results?.find((r: any) => r.option === option);
                    const percentage = result?.percentage || 0;
                    const voteCount = result?.voteCount || 0;
                    const isUserVote = userVote === index;
                    const isExpired = pollResults?.isExpired || false;
                    
                    return (
                      <div 
                        key={index}
                        className={`p-3 border rounded-lg transition-colors ${
                          isUserVote 
                            ? 'bg-blue-100 border-blue-300' 
                            : isExpired 
                              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:bg-blue-50 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isExpired && !isVoting) {
                            handleVote(option, index);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-800">{option}</span>
                            {isUserVote && <span className="text-blue-600 text-sm">✓ Your vote</span>}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-700">{percentage.toFixed(1)}%</span>
                            <div className="text-xs text-gray-500">{voteCount} votes</div>
                          </div>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isUserVote ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{width: `${percentage}%`}}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                  <div>
                    {pollResults && (
                      <span>Total votes: {pollResults.totalVotes}</span>
                    )}
                    {post.pollDuration && (
                      <span className="ml-4">Duration: {post.pollDuration} hours</span>
                    )}
                  </div>
                  <div>
                    {pollResults?.isExpired ? (
                      <span className="text-red-600 font-medium">🔒 Poll Expired</span>
                    ) : (
                      <span className="text-green-600 font-medium">🗳️ Active</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-100 text-red-700 rounded border border-red-300">
                ❌ Poll data missing or empty (postType: {post.postType})
              </div>
            )}
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
              onClick={(e) => onComment(post, e)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              data-comment-button
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

            {/* Repost Button */}
            <div data-repost-button>
              <RepostButton
                post={post}
                onRepostCreated={(repost) => {
                  console.log('🔄 Repost created in feed:', repost);
                  // Refresh the feed to show the new repost
                  window.location.reload(); // Simple reload for now
                }}
                size="md"
                showCount={true}
              />
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {post.viewsCount && post.viewsCount > 0 && `${post.viewsCount} views`}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SocialFeed;