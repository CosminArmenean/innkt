import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { socialService, UserProfile, Post, Group, Follow, KidAccount } from '../../services/social.service';
import { feedService } from '../../services/feed.service';
import { Repost } from '../../services/repost.service';
import { useAuth } from '../../contexts/AuthContext';
import FollowButton from './FollowButton';
import UserActionsMenu from './UserActionsMenu';
import ReportUserModal from './ReportUserModal';
import PageLayout from '../layout/PageLayout';
import ScrollableContent from '../layout/ScrollableContent';
import KidAccountManagement from '../accounts/KidAccountManagement';

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

const UserProfileComponent: React.FC<UserProfileProps> = ({ 
  userId, 
  isOwnProfile = false, 
  currentUserId 
}) => {
  const { t } = useTranslation();
  const { user, updateUser, reloadUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reposts, setReposts] = useState<Repost[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [kidAccounts, setKidAccounts] = useState<KidAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'media' | 'chat' | 'subaccounts' | 'business'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showKidAccountModal, setShowKidAccountModal] = useState(false);

  useEffect(() => {
    loadProfile();
    loadPosts();
    if (isOwnProfile) {
      loadKidAccounts();
    }
    if (!isOwnProfile && currentUserId) {
      checkFollowStatus();
    }
  }, [userId, currentUserId, isOwnProfile]);

  const handleTabChange = (tab: typeof activeTab) => {
    // Handle special navigation cases
    if (tab === 'chat') {
      navigate('/messaging');
      return;
    }
    
    setActiveTab(tab);
    
    // Load data when switching to reposts tab
    if (tab === 'reposts' && reposts.length === 0) {
      loadReposts();
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const userProfile = await socialService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await socialService.getPosts({ userId, limit: 20 });
      setPosts(response.posts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const loadReposts = async () => {
    try {
      const response = await feedService.getRepostsOnly(userId, 1, 20);
      setReposts(response.reposts);
    } catch (error) {
      console.error('Failed to load reposts:', error);
      setReposts([]);
    }
  };

  const loadKidAccounts = async () => {
    try {
      const accounts = await socialService.getKidAccounts();
      setKidAccounts(accounts);
      console.log('Loaded kid accounts:', accounts);
    } catch (error) {
      console.error('Failed to load kid accounts:', error);
    }
  };

  const checkFollowStatus = async () => {
    console.log('checkFollowStatus called:', { userId, isOwnProfile, currentUserId: user?.id });
    if (!currentUserId || isOwnProfile) {
      console.log('Skipping follow status check - own profile or no currentUserId');
      return;
    }
    
    try {
      const following = await socialService.getFollowing(currentUserId);
      console.log('Following data:', following);
      const isCurrentlyFollowing = following.following.some(f => f.following?.id === userId);
      console.log('Is currently following:', isCurrentlyFollowing);
      setIsFollowing(isCurrentlyFollowing);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  // Debug logging for action buttons rendering
  console.log('Rendering action buttons:', { isOwnProfile, userId, currentUserId: user?.id, isFollowing });

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    const formData = new FormData(event.currentTarget);
    const updateData = {
      displayName: formData.get('displayName') as string,
      bio: formData.get('bio') as string,
      location: formData.get('location') as string,
      website: formData.get('website') as string,
    };

    try {
      // Update profile via backend API
      await socialService.updateUserProfile(profile.id, updateData);
      
      // Reload profile to get updated data
      await loadProfile();
      
      // Exit edit mode
      setIsEditing(false);
      
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      // TODO: Show error message to user
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile || !profile) return;
    
    try {
      console.log('Starting avatar upload...');
      const result = await socialService.uploadAvatar(userId, selectedFile);
      console.log('Avatar upload result:', result);
      
      // Reload profile data from backend to ensure we have the latest data
      console.log('Reloading profile data...');
      const updatedProfile = await socialService.getUserProfile(userId);
      console.log('Updated profile data:', updatedProfile);
      console.log('Avatar URL:', updatedProfile.avatar);
      console.log('Profile Picture URL:', updatedProfile.profilePictureUrl);
      
      setProfile(updatedProfile);
      
      // Also reload the AuthContext user data if this is the current user's profile
      if (isOwnProfile) {
        await reloadUser();
      }
      
      setShowAvatarUpload(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  const leftSidebar = (
    <div className="relative p-8 text-center">
      <div className="relative inline-block">
        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 mx-auto">
          {(profile.avatar || profile.profilePictureUrl) ? (
            <img 
              src={profile.avatar || profile.profilePictureUrl} 
              alt={profile.displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log('Avatar image failed to load:', profile.avatar || profile.profilePictureUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-4xl text-white font-bold">
                {profile.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        
        {isOwnProfile && (
          <button
            onClick={() => setShowAvatarUpload(true)}
            className="absolute -bottom-2 -right-2 bg-card text-purple-600 p-2 rounded-full shadow-lg hover:bg-purple-50 transition-colors"
            title="Add/Change Profile Picture"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Username */}
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">{profile.displayName || 'Unknown User'}</h1>
      <p className="text-gray-500 text-sm mb-4">@{profile.username || 'unknown'}</p>
      
      
      {/* Verification badges */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        {profile.isVerified && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            ✓ Verified
          </span>
        )}
        {profile.isKidAccount && (
          <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
            👶 Kid Account
          </span>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-gray-700 text-sm leading-relaxed mb-6">{profile.bio}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{profile.followersCount}</div>
          <div className="text-xs text-gray-500">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{profile.followingCount}</div>
          <div className="text-xs text-gray-500">Following</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{profile.postsCount}</div>
          <div className="text-xs text-gray-500">Posts</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isOwnProfile && (
          <div className="flex items-center space-x-2">
            <FollowButton
              userId={userId}
              currentUserId={currentUserId}
              initialFollowing={isFollowing}
              onFollowChange={setIsFollowing}
              size="lg"
              variant="primary"
              className="flex-1"
            />
            <UserActionsMenu
              userId={userId}
              isFollowing={isFollowing}
              onFollow={() => setIsFollowing(true)}
              onUnfollow={() => setIsFollowing(false)}
              onReport={() => setShowReportModal(true)}
            />
          </div>
        )}
        
        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        )}
      </div>

      {/* Edit Profile Form */}
      {isEditing && isOwnProfile && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={profile.displayName || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your display name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                defaultValue={profile.bio || ''}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell us about yourself"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                defaultValue={profile.location || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Where are you from?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                defaultValue={profile.website || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  const centerContent = (
    <>
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 flex-shrink-0">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'posts', label: 'Posts', icon: '📝' },
            { id: 'reposts', label: 'Reposts', icon: '🔄' },
            { id: 'media', label: 'Media', icon: '📷' },
            { id: 'chat', label: 'Chat', icon: '💬' },
            { id: 'subaccounts', label: 'Subaccounts', icon: '👶' },
            { id: 'business', label: 'Business', icon: '💼' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <ScrollableContent>
                {activeTab === 'posts' && (
                  <div className="space-y-6">
                    {posts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                        <p className="text-gray-500">Posts will appear here when {isOwnProfile ? 'you' : 'they'} share something</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {posts.map((post) => {
                          // Check if this is a shared post (both users tagged)
                          const isSharedPost = post.tags && post.tags.includes('shared') && post.tags.includes('family');
                          const isMainUserPost = !isSharedPost;

                          return (
                            <div
                              key={post.id}
                              className={`${
                                isSharedPost
                                  ? 'bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 shadow-lg'
                                  : 'bg-gray-50 border border-gray-200'
                              } rounded-2xl p-6 hover:shadow-lg transition-all duration-300`}
                            >
                              {/* Shared Post Header */}
                              {isSharedPost && (
                                <div className="flex items-center space-x-2 mb-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span className="text-sm font-medium text-green-800">Shared Family Post</span>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white font-bold">{profile.displayName?.charAt(0) || 'U'}</span>
                                    </div>
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white font-bold">L</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {(profile.avatar || profile.profilePictureUrl) ? (
                                    <img 
                                      src={profile.avatar || profile.profilePictureUrl} 
                                      alt={profile.displayName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.log('Profile post avatar image failed to load:', profile.avatar || profile.profilePictureUrl);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-sm">
                                      {profile.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className={`font-semibold ${
                                      isSharedPost ? 'text-green-800' : 'text-gray-900'
                                    }`}>
                                      {profile.displayName || 'Unknown User'}
                                    </h4>
                                    <span className="text-gray-500 text-sm">@{profile.username || 'unknown'}</span>
                                    <span className="text-gray-400 text-sm">•</span>
                                    <span className="text-gray-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className={`mb-4 ${
                                    isSharedPost ? 'text-green-700 font-medium' : 'text-gray-800'
                                  }`}>
                                    {post.content}
                                  </p>
                                  <div className="flex items-center space-x-6 text-gray-500">
                                    <button className="flex items-center space-x-1 hover:text-purple-600 transition-colors">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                      <span>{post.likesCount}</span>
                                    </button>
                                    <button className="flex items-center space-x-1 hover:text-purple-600 transition-colors">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                      <span>{post.commentsCount}</span>
                                    </button>
                                    <button className="flex items-center space-x-1 hover:text-purple-600 transition-colors">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                      </svg>
                                      <span>{post.sharesCount}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reposts' && (
                  <div className="space-y-6">
                    {reposts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No reposts yet</h3>
                        <p className="text-gray-500">
                          {isOwnProfile 
                            ? "Reposts you create will appear here" 
                            : "This user hasn't reposted anything yet"
                          }
                        </p>
                        {isOwnProfile && (
                          <button 
                            onClick={() => setActiveTab('posts')}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Find Posts to Repost
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reposts.map((repost) => (
                          <div key={repost.repostId} className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Repost Header */}
                            <div className="px-6 py-3 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                              <div className="flex items-center space-x-3">
                                <span className="text-green-600">
                                  {repost.repostType === 'quote' ? '💬' : '🔄'}
                                </span>
                                <span className="text-sm font-medium text-gray-700">
                                  {repost.repostType === 'quote' ? 'Quote reposted' : 'Reposted'}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(repost.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Quote text for quote reposts */}
                              {repost.repostType === 'quote' && repost.quoteText && (
                                <div className="mt-3 p-3 bg-card rounded-lg border border-gray-200">
                                  <p className="text-gray-800 leading-relaxed">{repost.quoteText}</p>
                                </div>
                              )}
                            </div>

                            {/* Original Post Content */}
                            {repost.originalPostSnapshot && (
                              <div className="px-6 py-4">
                                <div className="flex items-start space-x-3 mb-4">
                                  <img
                                    src={repost.originalPostSnapshot.authorSnapshot?.avatarUrl || '/api/placeholder/48/48'}
                                    alt={repost.originalPostSnapshot.authorSnapshot?.username || 'User'}
                                    className="w-12 h-12 rounded-full border-2 border-purple-200"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h3 className="font-semibold text-gray-900">
                                        {repost.originalPostSnapshot.authorSnapshot?.displayName || 'Unknown User'}
                                      </h3>
                                      {repost.originalPostSnapshot.authorSnapshot?.isVerified && (
                                        <span className="text-blue-500">✓</span>
                                      )}
                                      <span className="text-gray-500 text-sm">
                                        @{repost.originalPostSnapshot.authorSnapshot?.username || 'unknown'}
                                      </span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-500 text-sm">
                                        {new Date(repost.originalPostSnapshot.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                      Original Post
                                    </span>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <p className="text-gray-800 leading-relaxed">{repost.originalPostSnapshot.content}</p>
                                </div>

                                {/* Original post media */}
                                {repost.originalPostSnapshot.mediaUrls && repost.originalPostSnapshot.mediaUrls.length > 0 && (
                                  <div className="mb-4">
                                    <div className="grid grid-cols-1 gap-2">
                                      {repost.originalPostSnapshot.mediaUrls.map((url, index) => (
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

                                {/* Engagement stats */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                                    <span className="flex items-center space-x-1">
                                      <span>❤️</span>
                                      <span>{repost.originalPostSnapshot.likesCount}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <span>💬</span>
                                      <span>{repost.originalPostSnapshot.commentsCount}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <span>🔄</span>
                                      <span>{repost.originalPostSnapshot.repostsCount}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <span>👁️</span>
                                      <span>{repost.originalPostSnapshot.viewsCount}</span>
                                    </span>
                                  </div>
                                  
                                  {/* Repost engagement */}
                                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                                    <span className="text-xs">Repost:</span>
                                    <span>❤️ {repost.likesCount}</span>
                                    <span>👁️ {repost.viewsCount}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'media' && (
                  <div className="space-y-6">
                    {(() => {
                      const mediaPosts = posts.filter(post => 
                        post.postType === 'image' || post.postType === 'video' || 
                        (post.media && post.media.length > 0) || 
                        (post.mediaUrls && post.mediaUrls.length > 0)
                      );
                      
                      return mediaPosts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">No media posts yet</h3>
                          <p className="text-gray-500 mb-6">Posts with photos and videos will appear here</p>
                          {isOwnProfile && (
                            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                              Share Your First Photo
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {mediaPosts.map((post) => (
                            <div key={post.id} className="bg-card border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                  <div className="text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-600 font-medium">Media Post</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="text-gray-800 text-sm line-clamp-2 mb-3">{post.content}</p>
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <div className="flex items-center space-x-4">
                                    <span className="flex items-center space-x-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                      <span>{post.likesCount}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                      <span>{post.commentsCount}</span>
                                    </span>
                                  </div>
                                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="space-y-6">
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {isOwnProfile ? 'Your Messages' : `Chat with ${profile.displayName || 'User'}`}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {isOwnProfile 
                          ? 'View and manage your conversations' 
                          : `Start a conversation with ${profile.displayName || 'User'}`
                        }
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => navigate('/messaging', { 
                            state: { 
                              selectedConversationId: null,
                              newChatUserId: isOwnProfile ? null : userId 
                            } 
                          })}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{isOwnProfile ? 'View Messages' : 'Start Chat'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'subaccounts' && (
                  <div className="space-y-6">
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Family Accounts</h3>
                      <p className="text-gray-500 mb-6">
                        {isOwnProfile 
                          ? 'Manage linked family member accounts and kid accounts' 
                          : 'This user\'s linked family accounts'
                        }
                      </p>
                      
                      {isOwnProfile && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                          <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Add Family Member</span>
                          </button>
                          <button 
                            onClick={() => setShowKidAccountModal(true)}
                            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center justify-center space-x-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Create Kid Account</span>
                          </button>
                        </div>
                      )}
                      
                      {kidAccounts.length > 0 ? (
                        <div className="space-y-4">
                          {kidAccounts.map((kid) => (
                            <div key={kid.id} className="bg-card rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-center space-x-4">
                                {/* Kid Profile Picture */}
                                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {kid.profilePictureUrl ? (
                                    <img
                                      src={kid.profilePictureUrl}
                                      alt={kid.fullName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-xl">
                                      {kid.firstName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Kid Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 text-lg">
                                      {kid.fullName}
                                    </h4>
                                    <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                                      👶 Kid Account
                                    </span>
                                    {kid.isActive ? (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mb-2">
                                    Status: {kid.status}
                                  </p>
                                  
                                  {kid.independenceDate && (
                                    <p className="text-sm text-gray-500">
                                      Independence Date: {new Date(kid.independenceDate).toLocaleDateString()}
                                    </p>
                                  )}
                                  
                                  <p className="text-xs text-gray-400 mt-2">
                                    Created: {new Date(kid.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex-shrink-0">
                                  <button
                                    onClick={() => navigate(`/profile/${kid.id}`)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                  >
                                    View Profile
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-8">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <p className="text-gray-600 font-medium mb-2">No kid accounts yet</p>
                            <p className="text-sm text-gray-500">Create kid accounts to manage family members</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'business' && (
                  <div className="space-y-6">
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Business & Links</h3>
                      <p className="text-gray-500 mb-6">
                        {isOwnProfile 
                          ? 'Manage your business accounts and professional links' 
                          : 'This user\'s business information and links'
                        }
                      </p>
                      
                      {isOwnProfile && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Add Business Link</span>
                          </button>
                          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Create Business Profile</span>
                          </button>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                            <p className="text-gray-600 font-medium mb-1">No business links yet</p>
                            <p className="text-sm text-gray-500">Add your website, social media, or business profiles</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
      </ScrollableContent>
    </>
  );

  const rightSidebar = (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Connection</h3>
      
      {profile?.linkedUser ? (
        /* Linked User Profile */
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 mx-auto mb-3">
            {profile.linkedUser.avatarUrl ? (
              <img 
                src={profile.linkedUser.avatarUrl} 
                alt={profile.linkedUser.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <span className="text-2xl text-white font-bold">
                  {profile.linkedUser.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-1">{profile.linkedUser.displayName || 'Unknown User'}</h4>
          <p className="text-gray-500 text-sm mb-4">@{profile.linkedUser.username || 'unknown'}</p>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-sm font-medium text-blue-800">Family Connection Info</span>
            </div>
            <p className="text-sm text-blue-700">Connected since 2024</p>
          </div>

          {/* Shared Content Stats */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-700">Shared Content</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">12</div>
                <div className="text-xs text-gray-500">Shared Posts</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">8</div>
                <div className="text-xs text-gray-500">Family Photos</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* User Selection Button */
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-300 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Linked Account</h4>
          <p className="text-gray-500 text-sm mb-4">Compare your account with another user</p>
          
          <button 
            onClick={() => {
              // TODO: Implement user selection modal
              console.log('Open user selection modal');
            }}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-4"
          >
            Select User to Compare
          </button>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Compare Features</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• View intercalated posts by date</li>
              <li>• Compare activity patterns</li>
              <li>• Temporary comparison only</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <PageLayout
        leftSidebar={leftSidebar}
        centerContent={centerContent}
        rightSidebar={rightSidebar}
      />

      {/* Avatar Upload Modal with Cropping */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Update Profile Picture</h3>
              <button
                onClick={() => {
                  setShowAvatarUpload(false);
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-purple-400 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-1">Upload New Photo</h4>
                <p className="text-sm text-gray-600 mb-2">Choose a photo to update your profile picture</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="mt-4 inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer font-medium"
                >
                  Choose File
                </label>
              </div>

              {/* Cropping Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Preview & Crop</h4>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {/* Circular cropping mask */}
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      {selectedFile ? (
                        <img 
                          src={URL.createObjectURL(selectedFile)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl text-white font-bold">
                          {profile.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    {/* Crop handles */}
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-dashed"></div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">
                  Drag to reposition • Pinch to zoom • Tap to adjust
                </p>
              </div>

              {/* Background Blending Options */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-900">Background Style</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-3 border-2 border-purple-500 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    <div className="w-8 h-8 rounded-full bg-card/20 mx-auto mb-1"></div>
                    <p className="text-xs font-medium">Purple</p>
                  </button>
                  <button className="p-3 border-2 border-gray-300 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                    <div className="w-8 h-8 rounded-full bg-card/20 mx-auto mb-1"></div>
                    <p className="text-xs font-medium">Blue</p>
                  </button>
                  <button className="p-3 border-2 border-gray-300 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <div className="w-8 h-8 rounded-full bg-card/20 mx-auto mb-1"></div>
                    <p className="text-xs font-medium">Green</p>
                  </button>
                </div>
              </div>

              {/* Background Removal Option */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-900">AI Background Removal</h4>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">NeuroSpark AI</h5>
                      <p className="text-sm text-gray-600">Automatically remove background for professional look</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Powered by NeuroSpark AI • Free for premium users</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => {
                    setShowAvatarUpload(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAvatarUpload}
                  disabled={!selectedFile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kid Account Management Modal */}
      {showKidAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Kid Account Management</h2>
                <button
                  onClick={() => setShowKidAccountModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <KidAccountManagement parentId={user?.id || ''} />
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        userId={userId}
        userName={profile?.username || 'Unknown User'}
      />
    </>
  );
};

export default UserProfileComponent;
