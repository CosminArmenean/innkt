import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Repost } from '../../services/repost.service';
import { Post } from '../../services/social.service';
import { repostService } from '../../services/repost.service';
import RepostModal from './RepostModal';
import CommentFloatingCard from './CommentFloatingCard';

interface RepostCardProps {
  repost: Repost;
  onLike?: (repostId: string) => void;
  onComment?: (repostId: string) => void;
  onShare?: (repostId: string) => void;
  onDelete?: (repostId: string) => void;
  currentUserId?: string;
  formatDate?: (date: string) => string;
}

const RepostCard: React.FC<RepostCardProps> = ({ 
  repost, 
  onLike, 
  onComment, 
  onShare, 
  onDelete, 
  currentUserId,
  formatDate = (date) => new Date(date).toLocaleDateString()
}) => {
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(repost.likesCount);
  const [showCommentCard, setShowCommentCard] = useState(false);
  const [commentCardPosition, setCommentCardPosition] = useState({ top: 0, left: 0 });

  const handleLike = async () => {
    try {
      if (isLiked) {
        await repostService.unlikeRepost(repost.repostId);
        setIsLiked(false);
        setLocalLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await repostService.likeRepost(repost.repostId);
        setIsLiked(true);
        setLocalLikesCount(prev => prev + 1);
      }
      onLike?.(repost.repostId);
    } catch (error) {
      console.error('Failed to toggle like on repost:', error);
    }
  };

  const handleCommentClick = (event: React.MouseEvent) => {
    // Get the position of the comment button
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const position = {
      top: buttonRect.bottom + 10, // Position below the button
      left: Math.min(buttonRect.left, window.innerWidth - 600) // Ensure it fits on screen
    };
    
    setCommentCardPosition(position);
    setShowCommentCard(true);
  };

  const isOwnRepost = currentUserId === repost.userId;
  const originalPost = repost.originalPostSnapshot;

  if (!originalPost) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center text-gray-500">
          <p>⚠️ Original post is no longer available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-theme overflow-hidden mb-6">
      {/* Repost Header */}
      <div className="repost-header">
        <div className="repost-header-content">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">
              {repost.repostType === 'quote' ? '💬' : '🔄'}
            </span>
            <img
              src={repost.userSnapshot?.avatarUrl || '/api/placeholder/24/24'}
              alt={repost.userSnapshot?.username || 'User'}
              className="w-6 h-6 rounded-full"
            />
            <span className="repost-header-text">
              {repost.userSnapshot?.displayName || 'Unknown User'}
            </span>
            <span className="repost-header-muted">
              {repost.repostType === 'quote' ? 'quote reposted' : 'reposted'}
            </span>
          </div>
          <span className="text-xs text-gray-400">•</span>
          <span className="repost-header-muted">{formatDate(repost.createdAt)}</span>
        </div>

        {/* Quote text for quote reposts */}
        {repost.repostType === 'quote' && repost.quoteText && (
          <div className="repost-quote">
            <p className="repost-quote-text">{repost.quoteText}</p>
          </div>
        )}
      </div>

      {/* Original Post Content */}
      <div className="repost-content">
        {/* Original Post Header */}
        <div className="flex items-start space-x-3 mb-4">
          <img
            src={originalPost.authorSnapshot?.avatarUrl || '/api/placeholder/48/48'}
            alt={originalPost.authorSnapshot?.username || 'User'}
            className="w-12 h-12 rounded-full border-2 border-purple-200"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-primary">
                {originalPost.authorSnapshot?.displayName || 'Unknown User'}
              </h3>
              {originalPost.authorSnapshot?.isVerified && (
                <span className="text-blue-500">✓</span>
              )}
              <span className="text-secondary text-sm">
                @{originalPost.authorSnapshot?.username || 'unknown'}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-secondary text-sm">{formatDate(originalPost.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="repost-badge">
                Original Post
              </span>
              {repost.repostChainLength > 1 && (
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                  Chain: {repost.repostChainLength}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Original Post Content */}
        <div className="mb-4">
          <p className="text-primary leading-relaxed">{originalPost.content}</p>
        </div>

        {/* Original Post Media */}
        {originalPost.mediaUrls && originalPost.mediaUrls.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-1 gap-2">
              {originalPost.mediaUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Original post media ${index + 1}`}
                    className="w-full h-auto rounded-lg object-cover max-h-96"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Original Post Poll */}
        {originalPost.postType === 'poll' && originalPost.pollOptions && originalPost.pollOptions.length > 0 && (
          <div className="mb-4">
            <div className="poll-container">
              <div className="poll-header">
                <h4 className="poll-title">
                  📊 Poll
                </h4>
                {originalPost.pollExpiresAt && (
                  <span className="poll-status">
                    ⏰ {new Date(originalPost.pollExpiresAt) > new Date() 
                      ? `Expires ${new Date(originalPost.pollExpiresAt).toLocaleDateString()}`
                      : 'Expired'
                    }
                  </span>
                )}
              </div>
              
              <div className="poll-options">
                {originalPost.pollOptions.map((option, index) => (
                  <div key={index} className="poll-option disabled">
                    <div className="poll-option-content">
                      <div className="flex items-center space-x-2">
                        <span className="poll-option-text">{option}</span>
                      </div>
                      <div className="poll-option-stats">
                        <span className="poll-percentage">0.0%</span>
                        <div className="poll-votes">0 votes</div>
                      </div>
                    </div>
                    <div className="poll-progress">
                      <div className="poll-progress-fill" style={{width: '0%'}}></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="poll-footer">
                <div className="poll-summary">
                  <span>Total votes: 0</span>
                  {originalPost.pollDuration && (
                    <span>Duration: {originalPost.pollDuration} hours</span>
                  )}
                </div>
                <div>
                  {originalPost.pollExpiresAt && new Date(originalPost.pollExpiresAt) <= new Date() ? (
                    <span className="poll-expired">🔒 Poll Expired</span>
                  ) : (
                    <span className="poll-active">🗳️ Active</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Original Post Engagement Stats */}
        <div className="repost-stats">
          <span className="flex items-center space-x-1">
            <span>❤️</span>
            <span>{originalPost.likesCount}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>💬</span>
            <span>{originalPost.commentsCount}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>🔄</span>
            <span>{originalPost.repostsCount}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>👁️</span>
            <span>{originalPost.viewsCount}</span>
          </span>
        </div>
      </div>

      {/* Repost Engagement Bar */}
      <div className="px-6 py-3 bg-gradient-to-r from-purple-900 to-indigo-900 border-t border-theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Like Repost */}
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'text-red-400 bg-red-500 bg-opacity-20' 
                  : 'text-white hover:text-red-400 hover:bg-red-500 hover:bg-opacity-20'
              }`}
            >
              <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm font-medium">{localLikesCount}</span>
            </button>

            {/* Comment on Repost */}
            <button
              onClick={handleCommentClick}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:text-blue-400 hover:bg-blue-500 hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{repost.commentsCount}</span>
            </button>

            {/* Share Repost */}
            <button
              onClick={() => onShare?.(repost.repostId)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:text-green-400 hover:bg-green-500 hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm font-medium">{repost.sharesCount}</span>
            </button>
          </div>

          {/* More Options */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-purple-200">👁️ {repost.viewsCount}</span>
            
            {isOwnRepost && (
              <button
                onClick={() => onDelete?.(repost.repostId)}
                className="text-purple-200 hover:text-red-400 p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition-colors"
                title="Delete repost"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Repost Modal */}
      <RepostModal
        post={{
          id: originalPost.postId,
          content: originalPost.content,
          // Simplified - remove complex authorProfile
          userId: originalPost.authorId,
          author: originalPost.authorSnapshot ? {
            id: originalPost.authorSnapshot.userId,
            username: originalPost.authorSnapshot.username,
            displayName: originalPost.authorSnapshot.displayName,
            avatarUrl: originalPost.authorSnapshot.avatarUrl,
            isVerified: originalPost.authorSnapshot.isVerified,
            isKidAccount: false
          } : undefined,
          postType: originalPost.postType as any,
          visibility: 'public',
          mediaUrls: originalPost.mediaUrls,
          hashtags: [],
          mentions: [],
          tags: [],
          isPublic: true,
          isPinned: false,
          likesCount: originalPost.likesCount,
          commentsCount: originalPost.commentsCount,
          sharesCount: originalPost.sharesCount,
          viewsCount: originalPost.viewsCount,
          isLiked: false,
          isShared: false,
          createdAt: originalPost.createdAt,
          updatedAt: originalPost.createdAt
        }}
        isOpen={false}
        onClose={() => {}}
        onRepostCreated={() => {}}
      />

      {/* Floating Comment Card */}
      {showCommentCard && repost.originalPostSnapshot && (
        <CommentFloatingCard
          post={{
            id: repost.originalPostSnapshot.postId,
            userId: repost.originalPostSnapshot.authorId,
            authorProfile: repost.originalPostSnapshot.authorSnapshot ? {
              id: repost.originalPostSnapshot.authorSnapshot.userId,
              displayName: repost.originalPostSnapshot.authorSnapshot.displayName,
              username: repost.originalPostSnapshot.authorSnapshot.username,
              email: '',
              avatar: repost.originalPostSnapshot.authorSnapshot.avatarUrl,
              isVerified: repost.originalPostSnapshot.authorSnapshot.isVerified,
              isKidAccount: false,
              bio: '',
              location: '',
              website: '',
              dateOfBirth: '',
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              createdAt: '',
              updatedAt: '',
              preferences: {
                privacyLevel: 'public',
                allowDirectMessages: true,
                allowMentions: true,
                notificationSettings: {
                  newFollowers: true,
                  newPosts: true,
                  mentions: true,
                  directMessages: true,
                  groupUpdates: true,
                  emailNotifications: true,
                  pushNotifications: true
                },
                theme: 'light',
                language: 'en',
                timezone: 'UTC'
              },
              socialLinks: {},
              linkedUser: null
            } : undefined,
            content: repost.originalPostSnapshot.content,
            mediaUrls: repost.originalPostSnapshot.mediaUrls || [],
            postType: (repost.originalPostSnapshot.postType as 'text' | 'image' | 'video' | 'link' | 'poll') || 'text',
            visibility: 'public',
            likesCount: repost.originalPostSnapshot.likesCount,
            commentsCount: repost.originalPostSnapshot.commentsCount,
            sharesCount: repost.originalPostSnapshot.sharesCount,
            repostsCount: repost.originalPostSnapshot.repostsCount,
            viewsCount: repost.originalPostSnapshot.viewsCount,
            isLiked: false,
            isShared: false,
            createdAt: repost.originalPostSnapshot.createdAt,
            updatedAt: repost.originalPostSnapshot.createdAt
          }}
          isOpen={showCommentCard}
          onClose={() => setShowCommentCard(false)}
          position={commentCardPosition}
        />
      )}
    </div>
  );
};

export default RepostCard;
