import React, { useState } from 'react';
import { EllipsisHorizontalIcon, UserMinusIcon, ExclamationTriangleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { socialService } from '../../services/social.service';

interface UserActionsMenuProps {
  userId: string;
  isFollowing: boolean;
  onUnfollow: () => void;
  onFollow: () => void;
  onReport: () => void;
  className?: string;
}

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  userId,
  isFollowing,
  onUnfollow,
  onFollow,
  onReport,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (isFollowing) return;
    
    setIsLoading(true);
    try {
      await socialService.followUser(userId);
      onFollow();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to follow user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!isFollowing) return;
    
    setIsLoading(true);
    try {
      await socialService.unfollowUser(userId);
      onUnfollow();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = () => {
    onReport();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        title="More actions"
      >
        <EllipsisHorizontalIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <UserMinusIcon className="w-4 h-4" />
                  <span>{isLoading ? 'Unfollowing...' : 'Unfollow'}</span>
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>{isLoading ? 'Following...' : 'Follow'}</span>
                </button>
              )}
              
              <button
                onClick={handleReport}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>Report User</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserActionsMenu;
