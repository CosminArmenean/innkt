import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, MessageCircle, Share2, MoreHorizontal, ChevronDown, ChevronUp, Reply, Flag, User } from 'lucide-react';
import { Comment, Post, UserProfile } from '../../services/social.service';
import { socialService } from '../../services/social.service';
import { useAuth } from '../../contexts/AuthContext';
import CommentComposer from './CommentComposer';
import { formatDistanceToNow } from 'date-fns';

interface CommentFloatingCardProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; left: number };
}

interface CommentThread {
  comment: Comment;
  replies: CommentThread[];
  depth: number;
  isExpanded: boolean;
  isCollapsed: boolean;
}

const MAX_DEPTH = 3;
const COMMENTS_PER_PAGE = 20;

const CommentFloatingCard: React.FC<CommentFloatingCardProps> = ({
  post,
  isOpen,
  onClose,
  position = { top: 0, left: 0 }
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showComposer, setShowComposer] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());
  const [showHiddenComments, setShowHiddenComments] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load comments when card opens
  useEffect(() => {
    if (isOpen && post.id) {
      loadComments(true);
    }
  }, [isOpen, post.id]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Auto-scroll to center the comment card when it opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the card is fully rendered
      const scrollTimer = setTimeout(() => {
        // Find the original comment button - try multiple selectors
        let commentButton = document.querySelector(`[data-post-id="${post.id}"] [data-comment-button]`) as HTMLElement;
        
        // Fallback: try to find any comment button for this post
        if (!commentButton) {
          commentButton = document.querySelector(`[data-post-id="${post.id}"] button[title*="comment"], [data-post-id="${post.id}"] button[aria-label*="comment"]`) as HTMLElement;
        }
        
        // Fallback: try to find the post element itself
        if (!commentButton) {
          commentButton = document.querySelector(`[data-post-id="${post.id}"]`) as HTMLElement;
        }
        
        if (commentButton) {
          console.log('🎯 Auto-scrolling to center comment card for post:', post.id);
          
          // Calculate the center position for the comment button
          const buttonRect = commentButton.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          
          // Calculate the ideal scroll position to center the button
          const idealButtonTop = viewportHeight / 2 - 150; // 150px offset to account for card height
          const idealButtonLeft = viewportWidth / 2 - 300; // 300px offset to account for card width
          
          // Calculate current scroll position
          const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const currentScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          
          // Calculate target scroll position
          const targetScrollTop = currentScrollTop + buttonRect.top - idealButtonTop;
          const targetScrollLeft = currentScrollLeft + buttonRect.left - idealButtonLeft;
          
          console.log('📍 Scroll calculation:', {
            buttonRect: buttonRect,
            idealButtonTop,
            idealButtonLeft,
            targetScrollTop,
            targetScrollLeft
          });
          
          // Smooth scroll to center the comment button
          window.scrollTo({
            top: Math.max(0, targetScrollTop),
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth'
          });
        } else {
          console.warn('❌ Could not find comment button for post:', post.id);
        }
      }, 200); // Increased delay to 200ms

      return () => clearTimeout(scrollTimer);
    }
  }, [isOpen, post.id]);

  // Update position on scroll to maintain anchor point
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && cardRef.current) {
        // Find the original comment button to maintain position
        const commentButton = document.querySelector(`[data-post-id="${post.id}"] [data-comment-button]`) as HTMLElement;
        if (commentButton) {
          const buttonRect = commentButton.getBoundingClientRect();
          const newPosition = {
            top: buttonRect.bottom + 10,
            left: Math.min(buttonRect.left, window.innerWidth - 600)
          };
          
          cardRef.current.style.top = `${newPosition.top}px`;
          cardRef.current.style.left = `${newPosition.left}px`;
          cardRef.current.style.transform = 'none';
        }
      }
    };

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isOpen, post.id]);

  // Close on click outside (less aggressive without backdrop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        // Only close if clicking on the feed content, not other UI elements
        const target = event.target as HTMLElement;
        if (target.closest('[data-post-id]') || target.closest('.social-feed')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const loadComments = async (reset = false) => {
    if (isLoading) return;

    console.log('🔄 Loading comments for post:', post.id, 'reset:', reset);
    
    // Debug authentication
    const token = localStorage.getItem('accessToken');
    console.log('🔐 Auth token present:', !!token);
    console.log('🔐 Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    
    setIsLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const response = await socialService.getComments(post.id, currentPage, COMMENTS_PER_PAGE);
      
      console.log('📝 Comment API response:', response);
      console.log('📝 Comment API response type:', typeof response);
      console.log('📝 Comment API response keys:', Object.keys(response || {}));
      
      // Handle different response formats
      let newComments: Comment[] = [];
      if (Array.isArray(response)) {
        newComments = response;
        console.log('📝 Using response as array, length:', newComments.length);
      } else if (response.comments && Array.isArray(response.comments)) {
        newComments = response.comments;
        console.log('📝 Using response.comments, length:', newComments.length);
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        newComments = (response as any).data;
        console.log('📝 Using response.data, length:', newComments.length);
      }
      
      // Log when no comments are found from API
      if (newComments.length === 0) {
        console.log('📭 No comments found in API response for post:', post.id);
        console.log('📭 Full response structure:', JSON.stringify(response, null, 2));
      }
      
      console.log('💬 New comments loaded:', newComments.length, newComments);
      
      if (reset) {
        setComments(newComments);
        setPage(2);
      } else {
        setComments(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNewComments = newComments.filter(c => !existingIds.has(c.id));
          return [...prev, ...uniqueNewComments];
        });
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.hasMore || false);
      
      // Build threaded structure
      buildCommentThreads(reset ? newComments : [...comments, ...newComments]);
      
    } catch (error) {
      console.error('❌ Failed to load comments:', error);
      // Set empty comments and let the UI show "No comments yet"
      setComments([]);
      setCommentThreads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildCommentThreads = (commentsList: Comment[]) => {
    console.log('🧵 Building comment threads from:', commentsList.length, 'comments');
    const commentMap = new Map<string, CommentThread>();
    const rootThreads: CommentThread[] = [];

    // Flatten all comments including nested replies
    const allComments: Comment[] = [];
    const flattenComments = (comments: Comment[]) => {
      comments.forEach(comment => {
        allComments.push(comment);
        if (comment.replies && comment.replies.length > 0) {
          flattenComments(comment.replies);
        }
      });
    };
    flattenComments(commentsList);

    console.log('📝 Flattened comments:', allComments.length, allComments);

    // Create thread objects for all comments
    allComments.forEach(comment => {
      commentMap.set(comment.id, {
        comment,
        replies: [],
        depth: 0,
        isExpanded: true,
        isCollapsed: false
      });
    });

    // Build hierarchy
    allComments.forEach(comment => {
      const thread = commentMap.get(comment.id)!;
      
      if (comment.parentCommentId) {
        const parentThread = commentMap.get(comment.parentCommentId);
        if (parentThread) {
          thread.depth = parentThread.depth + 1;
          parentThread.replies.push(thread);
        }
      } else {
        rootThreads.push(thread);
      }
    });

    // Apply collapse logic for deep threads
    const applyCollapseLogic = (threads: CommentThread[]) => {
      threads.forEach(thread => {
        if (thread.depth >= MAX_DEPTH) {
          thread.isCollapsed = true;
        }
        applyCollapseLogic(thread.replies);
      });
    };

    applyCollapseLogic(rootThreads);
    console.log('🎯 Final comment threads:', rootThreads.length, rootThreads);
    setCommentThreads(rootThreads);
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      // TODO: Implement like comment API
      console.log('Like comment:', commentId);
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setShowComposer(true);
  };

  // Generate initial content with @username for replies
  const getInitialContent = (comment: Comment) => {
    if (!comment.author?.username) return '';
    return `@${comment.author.username} `;
  };

  // Parse @mentions and make them clickable links
  const parseMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username (odd indices after split)
        const username = part;
        return (
          <button
            key={index}
            onClick={() => handleMentionClick(username)}
            className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors"
          >
            @{username}
          </button>
        );
      }
      return part; // Regular text
    });
  };

  // Handle @mention clicks
  const handleMentionClick = (username: string) => {
    console.log('🔗 Mention clicked:', username);
    // TODO: Navigate to user profile
    // For now, just show an alert
    alert(`Navigate to @${username}'s profile`);
  };

  const handleCommentCreated = (newComment: Comment) => {
    console.log('🎉 New comment created:', newComment);
    
    // Note: @grok processing is handled by Social Service in the background
    // No need to call Grok API from frontend
    
    setComments(prev => {
      const updatedComments = [newComment, ...prev];
      buildCommentThreads(updatedComments);
      return updatedComments;
    });
    setShowComposer(false);
    setReplyingTo(null);
  };

  const toggleThreadExpansion = (commentId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const toggleThreadCollapse = (commentId: string) => {
    setCollapsedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const canUserComment = () => {
    // Check if user can comment based on post restrictions
    if (post.visibility === 'private' && post.userId !== user?.id) {
      return false;
    }
    // Add more restriction logic here
    return true;
  };

  const renderComment = (thread: CommentThread, index: number) => {
    const { comment } = thread;
    const isExpanded = expandedThreads.has(comment.id) || !thread.isCollapsed;
    const isCollapsed = collapsedThreads.has(comment.id);
    const hasReplies = thread.replies.length > 0;
    const isDeepThread = thread.depth >= MAX_DEPTH;

    return (
      <div
        key={comment.id}
        className={`comment-thread ${thread.depth > 0 ? 'ml-6' : ''}`}
        style={{ 
          marginLeft: `${thread.depth * 20}px`,
          borderLeft: thread.depth > 0 ? '2px solid #e5e7eb' : 'none',
          paddingLeft: thread.depth > 0 ? '12px' : '0'
        }}
      >
        <div className="comment-item bg-white rounded-lg p-3 mb-2 border border-gray-100 hover:border-gray-200 transition-colors">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {comment.author?.avatarUrl ? (
                  <img 
                    src={comment.author.avatarUrl} 
                    alt={comment.author.displayName || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Comment avatar image failed to load:', comment.author?.avatarUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {comment.author?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-gray-900 text-sm">
                    {comment.author?.displayName || 'Unknown User'}
                  </span>
                  {comment.author?.isVerified && (
                    <div title="Verified Account">
                      <User className="w-3 h-3 text-blue-500" />
                    </div>
                  )}
                  <span className="text-gray-500 text-xs">
                    @{comment.author?.username || 'unknown'}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">
                  {comment.createdAt ? (() => {
                    try {
                      return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
                    } catch (error) {
                      return 'Just now';
                    }
                  })() : 'Just now'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {/* TODO: Implement report */}}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Report comment"
              >
                <Flag className="w-3 h-3 text-gray-400" />
              </button>
              <button
                onClick={() => {/* TODO: Implement more options */}}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Comment Content */}
          <div className="comment-content mb-3">
            <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
              {parseMentions(comment.content)}
            </p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                  comment.isLiked 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{comment.likesCount || 0}</span>
              </button>

              <button
                onClick={() => handleReply(comment)}
                disabled={thread.depth >= 3} // Disable if at max depth (3 = 4 levels total)
                className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                  thread.depth >= 3 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                }`}
                title={thread.depth >= 3 ? 'Maximum nesting depth reached' : 'Reply to this comment'}
              >
                <Reply className="w-4 h-4" />
                <span className="text-xs">Reply</span>
              </button>

              <button
                onClick={() => {/* TODO: Implement share comment */}}
                className="flex items-center space-x-1 px-2 py-1 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs">Share</span>
              </button>
            </div>

            {/* Thread Controls */}
            {hasReplies && (
              <div className="flex items-center space-x-2">
                {isDeepThread && (
                  <button
                    onClick={() => toggleThreadCollapse(comment.id)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {isCollapsed ? (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        <span>Show more replies</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        <span>Show fewer replies</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Depth Limit Message */}
            {thread.depth >= 3 && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Maximum nesting depth reached.</span> 
                  {' '}This thread cannot be nested further to maintain readability.
                </p>
              </div>
            )}
          </div>

          {/* Replies */}
          {hasReplies && isExpanded && !isCollapsed && (
            <div className="mt-3 space-y-2">
              {thread.replies.map((reply, replyIndex) => 
                renderComment(reply, replyIndex)
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Floating Card - No backdrop to allow scrolling */}
      <div
        ref={cardRef}
        className="fixed z-50 bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col popover-card border border-gray-200"
        style={{
          top: position.top > 0 ? `${position.top}px` : '50%',
          left: position.left > 0 ? `${position.left}px` : '50%',
          transform: position.top > 0 ? 'none' : 'translate(-50%, -50%)',
          maxHeight: '80vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              {post.author?.avatarUrl ? (
                <img 
                  src={post.author.avatarUrl} 
                  alt={post.author.displayName || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('Post header avatar image failed to load:', post.author?.avatarUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {post.author?.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {post.author?.displayName || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500">
                {post.commentsCount || 0} comments
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comments List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : commentThreads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              {commentThreads.map((thread, index) => renderComment(thread, index))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={() => loadComments(false)}
                    disabled={isLoadingMore}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More Comments'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Comment Composer */}
        {canUserComment() && (
          <div className="border-t border-gray-200 p-4">
            {showComposer ? (
              <CommentComposer
                post={post}
                parentComment={replyingTo}
                initialContent={replyingTo ? getInitialContent(replyingTo) : ''}
                onCommentCreated={handleCommentCreated}
                onCancel={() => {
                  setShowComposer(false);
                  setReplyingTo(null);
                }}
              />
            ) : (
              <button
                onClick={() => setShowComposer(true)}
                className="w-full p-3 text-left text-gray-500 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                Write a comment...
              </button>
            )}
          </div>
        )}

        {/* Comment Restrictions Notice */}
        {!canUserComment() && (
          <div className="border-t border-gray-200 p-4">
            <div className="text-center text-gray-500 text-sm">
              <MessageCircle className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              <p>Comments are restricted on this post</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CommentFloatingCard;
