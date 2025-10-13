import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { socialService, Follow } from '../../services/social.service';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';

const FollowersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

  const loadFollowers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await socialService.getFollowers(user?.id || '');
      setFollowers(response.followers);
    } catch (error) {
      console.error('Failed to load followers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadFollowing = useCallback(async () => {
    try {
      const response = await socialService.getFollowing(user?.id || '');
      setFollowing(response.following);
    } catch (error) {
      console.error('Failed to load following:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadFollowers();
      loadFollowing();
    }
  }, [user?.id, loadFollowers, loadFollowing]);

  const handleFollow = async (userId: string) => {
    try {
      await socialService.followUser(userId);
      loadFollowers();
      loadFollowing();
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await socialService.unfollowUser(userId);
      loadFollowers();
      loadFollowing();
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const renderUserList = (users: Follow[], isFollowing: boolean = false) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={`skeleton-${i}`} className="animate-pulse">
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isFollowing ? t('social.notFollowingYet') : t('social.noFollowersYet')}
          </h3>
          <p className="text-gray-500">
            {isFollowing 
              ? t('social.startFollowingPeople')
              : t('social.shareProfileToGetFollowers')
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {users.map((follow, index) => {
          // Get the appropriate profile based on whether we're showing followers or following
          const profile = isFollowing ? follow.following : follow.follower;
          
          return (
            <div key={`${follow.id}-${index}`} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 
                    className="font-medium text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleUserClick(profile?.id || '')}
                  >
                    {profile?.displayName || t('social.unknownUser')}
                  </h3>
                  <p 
                    className="text-sm text-gray-500 cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleUserClick(profile?.id || '')}
                  >
                    @{profile?.username || 'unknown'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isFollowing ? t('social.followingSince') : t('social.followingYouSince')} {new Date(follow.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                {isFollowing ? (
                  <button
                    onClick={() => handleUnfollow(profile?.id || '')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <UserMinusIcon className="h-4 w-4" />
                    <span>{t('social.unfollow')}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollow(profile?.id || '')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    <span>{t('social.followBack')}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('social.followersAndFollowing')}</h1>
          <p className="text-gray-600">{t('social.manageSocialConnections')}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('followers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'followers'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('social.followers')} ({followers.length})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('social.following')} ({following.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'followers' ? renderUserList(followers) : renderUserList(following, true)}
        </div>
      </div>
    </div>
  );
};

export default FollowersPage;