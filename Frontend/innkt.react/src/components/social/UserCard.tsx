import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../../services/social.service';
import FollowButton from './FollowButton';

interface UserCardProps {
  user: UserProfile;
  currentUserId?: string;
  showBio?: boolean;
  showStats?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onUserClick?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  currentUserId,
  showBio = true,
  showStats = false,
  size = 'md',
  className = '',
  onUserClick
}) => {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: {
      avatar: 'w-10 h-10',
      name: 'text-sm',
      username: 'text-xs',
      bio: 'text-xs',
      stats: 'text-xs'
    },
    md: {
      avatar: 'w-12 h-12',
      name: 'text-base',
      username: 'text-sm',
      bio: 'text-sm',
      stats: 'text-sm'
    },
    lg: {
      avatar: 'w-16 h-16',
      name: 'text-lg',
      username: 'text-base',
      bio: 'text-base',
      stats: 'text-base'
    }
  };

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick(user.id);
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${className}`}>
      <div 
        className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
        onClick={handleUserClick}
      >
        {/* Avatar */}
        <div className={`${sizeClasses[size].avatar} rounded-full bg-gray-200 overflow-hidden flex-shrink-0`}>
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log('UserCard avatar image failed to load:', user.avatar);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-lg">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className={`font-medium text-gray-900 truncate ${sizeClasses[size].name}`}>
              {user.displayName}
            </h4>
            
            {user.isVerified && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                ✓
              </span>
            )}
            
            {user.isKidAccount && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                👶
              </span>
            )}
          </div>
          
          <p className={`text-gray-600 truncate ${sizeClasses[size].username}`}>
            @{user.username}
          </p>
          
          {showBio && user.bio && (
            <p className={`text-gray-500 mt-1 line-clamp-2 ${sizeClasses[size].bio}`}>
              {user.bio}
            </p>
          )}
          
          {showStats && (
            <div className={`flex items-center space-x-4 mt-2 text-gray-500 ${sizeClasses[size].stats}`}>
              <span>{user.postsCount} {t('social.posts')}</span>
              <span>{user.followersCount} {t('social.followers')}</span>
              <span>{user.followingCount} {t('social.following')}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Follow Button */}
      <div className="flex-shrink-0 ml-3">
        <FollowButton
          userId={user.id}
          currentUserId={currentUserId}
          size={size === 'lg' ? 'md' : 'sm'}
          variant="primary"
        />
      </div>
    </div>
  );
};

export default UserCard;
