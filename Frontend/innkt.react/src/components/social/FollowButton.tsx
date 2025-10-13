import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { socialService } from '../../services/social.service';

interface FollowButtonProps {
  userId: string;
  currentUserId?: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  currentUserId,
  initialFollowing = false,
  onFollowChange,
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const { t } = useTranslation();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  const handleFollow = async () => {
    if (!currentUserId || currentUserId === userId) return;
    
    setIsLoading(true);
    try {
      if (isFollowing) {
        await socialService.unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await socialService.followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show follow button for own profile
  if (!currentUserId || currentUserId === userId) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: isFollowing 
      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
      : 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: isFollowing 
      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
      : 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    outline: isFollowing 
      ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' 
      : 'border border-purple-600 text-purple-600 hover:bg-purple-50'
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
          <span>{t('common.loading')}</span>
        </div>
      ) : (
        isFollowing ? t('social.following') : t('social.follow')
      )}
    </button>
  );
};

export default FollowButton;
