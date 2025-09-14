import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socialService, UserProfile, Post, Group, Follow } from '../../services/social.service';
import FollowButton from './FollowButton';

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
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'chat' | 'subaccounts' | 'business'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, [userId]);

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

  const handleTabChange = (tab: 'posts' | 'media' | 'chat' | 'subaccounts' | 'business') => {
    setActiveTab(tab);
  };

  const handleSaveProfile = async () => {
    // Implementation for saving profile
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
      const result = await socialService.uploadAvatar(userId, selectedFile);
      setProfile({ ...profile, avatar: result.avatarUrl });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side - Profile Info */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8">
              {/* Profile Picture Section */}
              <div className="relative p-8 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 mx-auto">
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-4xl text-white font-bold">
                          {profile.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowAvatarUpload(true)}
                      className="absolute -bottom-2 -right-2 bg-white text-purple-600 p-2 rounded-full shadow-lg hover:bg-purple-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Username */}
                <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">{profile.displayName}</h1>
                <p className="text-gray-500 text-sm mb-4">@{profile.username}</p>
                
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
                    <FollowButton
                      userId={userId}
                      currentUserId={currentUserId}
                      initialFollowing={isFollowing}
                      onFollowChange={setIsFollowing}
                      size="lg"
                      variant="primary"
                      className="w-full"
                    />
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
              </div>
            </div>
          </div>

          {/* Center - Content */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Navigation Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'posts', label: 'Posts', icon: '📝' },
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
              <div className="p-6">
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
                                      <span className="text-xs text-white font-bold">{profile.displayName.charAt(0)}</span>
                                    </div>
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white font-bold">L</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start space-x-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isSharedPost 
                                    ? 'bg-gradient-to-br from-green-500 to-blue-600' 
                                    : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                }`}>
                                  <span className="text-white font-bold text-sm">
                                    {profile.displayName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className={`font-semibold ${
                                      isSharedPost ? 'text-green-900' : 'text-gray-900'
                                    }`}>
                                      {profile.displayName}
                                    </h4>
                                    <span className={`text-sm ${
                                      isSharedPost ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                      @{profile.username}
                                    </span>
                                    <span className="text-gray-400 text-sm">•</span>
                                    <span className="text-gray-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    {isSharedPost && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Shared
                                      </span>
                                    )}
                                  </div>
                                  <p className={`mb-4 ${
                                    isSharedPost ? 'text-green-800 font-medium' : 'text-gray-800'
                                  }`}>
                                    {post.content}
                                  </p>
                                  <div className="flex items-center space-x-6 text-gray-500">
                                    <button className={`flex items-center space-x-1 transition-colors ${
                                      isSharedPost ? 'hover:text-green-600' : 'hover:text-purple-600'
                                    }`}>
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                      <span>{post.likesCount}</span>
                                    </button>
                                    <button className={`flex items-center space-x-1 transition-colors ${
                                      isSharedPost ? 'hover:text-green-600' : 'hover:text-purple-600'
                                    }`}>
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                      <span>{post.commentsCount}</span>
                                    </button>
                                    <button className={`flex items-center space-x-1 transition-colors ${
                                      isSharedPost ? 'hover:text-green-600' : 'hover:text-purple-600'
                                    }`}>
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

                {activeTab === 'media' && (
                  <div className="space-y-6">
                    {(() => {
                      const mediaPosts = posts.filter(post => 
                        post.type === 'image' || post.type === 'video' || 
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
                            <div key={post.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
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
                        {isOwnProfile ? 'Your Messages' : `Chat with ${profile.displayName}`}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {isOwnProfile 
                          ? 'View and manage your conversations' 
                          : `Start a conversation with ${profile.displayName}`
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
                          <button className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Create Kid Account</span>
                          </button>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 rounded-xl p-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-medium mb-2">No linked accounts yet</p>
                          <p className="text-sm text-gray-500">Family member accounts will appear here when linked</p>
                        </div>
                      </div>
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
              </div>
            </div>
          </div>

          {/* Right Side - Linked User Profile */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Linked User Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="relative">
                  {/* Linked User Cover Image */}
                  <div className="h-32 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/90 to-indigo-800/90"></div>
                    
                    {/* Linked User Profile Picture */}
                    <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-3 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-2xl text-white font-bold">L</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Linked User Name */}
                    <div className="absolute bottom-0 left-28 transform translate-y-1/2">
                      <h3 className="text-lg font-bold text-white mb-1">Linked User</h3>
                      <p className="text-blue-100 text-sm">@linkeduser</p>
                    </div>
                  </div>

                  {/* Linked User Info */}
                  <div className="pt-12 pb-4 px-4">
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-4">Family member account</p>
                      
                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-gray-900">0</div>
                          <div className="text-xs text-gray-500">Posts</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">0</div>
                          <div className="text-xs text-gray-500">Followers</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">0</div>
                          <div className="text-xs text-gray-500">Following</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Connection Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Family Connection
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Relationship</span>
                    <span className="font-medium text-gray-900">Parent/Child</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Linked Since</span>
                    <span className="font-medium text-gray-900">Jan 2024</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Shared Posts</span>
                    <span className="font-medium text-gray-900">0</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => navigate(`/profile/linked-user-id`)}
                    className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    View Linked Profile
                  </button>
                </div>
              </div>

              {/* Common Posts Highlight */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Shared Content
                </h4>
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-1">No shared posts yet</p>
                    <p className="text-sm text-gray-500">Posts where both users are tagged will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal with Cropping */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
            
            <div className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload New Photo</h4>
                <p className="text-gray-600 mb-4">Choose a photo to update your profile picture</p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB • Recommended: 400x400px</p>
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
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Preview & Crop</h4>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {/* Circular cropping mask */}
                    <div className="w-48 h-48 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      {selectedFile ? (
                        <img 
                          src={URL.createObjectURL(selectedFile)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl text-white font-bold">
                          {profile.displayName.charAt(0).toUpperCase()}
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
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Background Style</h4>
                <div className="grid grid-cols-3 gap-4">
                  <button className="p-4 border-2 border-purple-500 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    <div className="w-12 h-12 rounded-full bg-white/20 mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Purple</p>
                  </button>
                  <button className="p-4 border-2 border-gray-300 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                    <div className="w-12 h-12 rounded-full bg-white/20 mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Blue</p>
                  </button>
                  <button className="p-4 border-2 border-gray-300 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <div className="w-12 h-12 rounded-full bg-white/20 mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Green</p>
                  </button>
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
    </div>
  );
};

export default UserProfileComponent;
