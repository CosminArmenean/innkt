import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Post } from '../../services/social.service';
import { repostService } from '../../services/repost.service';
import RepostModal from './RepostModal';

interface RepostButtonProps {
  post: Post;
  onRepostCreated?: (repost: any) => void;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RepostButton: React.FC<RepostButtonProps> = ({ 
  post, 
  onRepostCreated, 
  className = '',
  showCount = true,
  size = 'md'
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasReposted, setHasReposted] = useState(false);
  const [canRepost, setCanRepost] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Check repost status on component mount
  useEffect(() => {
    checkRepostStatus();
  }, [post.id]);

  const checkRepostStatus = async () => {
    try {
      const response = await repostService.canRepost(post.id);
      setHasReposted(response.hasAlreadyReposted);
      setCanRepost(response.canRepost);
    } catch (error) {
      console.error('Failed to check repost status:', error);
    }
  };

  const handleRepostClick = () => {
    if (!canRepost) {
      if (hasReposted) {
        alert(t('social.alreadyReposted'));
      } else {
        alert(t('social.cannotRepost'));
      }
      return;
    }

    setIsModalOpen(true);
  };

  const handleRepostCreated = (repost: any) => {
    setHasReposted(true);
    setCanRepost(false);
    onRepostCreated?.(repost);
    
    // Update the post's repost count locally
    if (post.repostsCount !== undefined) {
      post.repostsCount += 1;
    }
  };

  // Size-based styling
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
          text: 'text-xs'
        };
      case 'lg':
        return {
          button: 'px-4 py-3 text-base',
          icon: 'w-6 h-6',
          text: 'text-base'
        };
      default:
        return {
          button: 'px-3 py-2 text-sm',
          icon: 'w-4 h-4',
          text: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <>
      <button
        onClick={handleRepostClick}
        disabled={isLoading}
        className={`
          flex items-center space-x-2 rounded-lg transition-all duration-200
          ${hasReposted 
            ? 'text-green-600 bg-green-50 border border-green-200' 
            : canRepost
              ? 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              : 'text-gray-300 cursor-not-allowed'
          }
          ${sizeClasses.button}
          ${className}
        `}
        title={hasReposted ? t('social.alreadyRepostedTitle') : canRepost ? t('social.repostThisContent') : t('social.cannotRepostTitle')}
      >
        {/* Repost Icon */}
        <svg 
          className={`${sizeClasses.icon} ${hasReposted ? 'fill-current' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>

        {/* Count and Label */}
        {showCount && (
          <span className={`font-medium ${sizeClasses.text}`}>
            {post.repostsCount || 0}
          </span>
        )}
        
        {/* Status indicator */}
        {hasReposted && (
          <span className="text-xs text-green-600 font-medium">
            ✓
          </span>
        )}
      </button>

      {/* Repost Modal */}
      <RepostModal
        post={post}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRepostCreated={handleRepostCreated}
      />
    </>
  );
};

export default RepostButton;
