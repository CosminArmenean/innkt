import React, { useState, useEffect } from 'react';
import { socialService, UserProfile, Post, Group } from '../../services/social.service';

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
}

const UserProfileComponent: React.FC<UserProfileProps> = ({ userId, isOwnProfile = false }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'groups' | 'followers' | 'following' | 'blockchain'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
    loadPosts();
    loadGroups();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const userProfile = await socialService.getUserProfile(userId);
      setProfile(userProfile);
      setEditForm(userProfile);
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

  const loadGroups = async () => {
    try {
      const response = await socialService.getGroups({ search: '', limit: 10 });
      setGroups(response.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profile) return;
    
    try {
      const updatedProfile = await socialService.updateUserProfile(userId, editForm);
      setProfile(updatedProfile);
      setEditForm(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      if (profile.followersCount > 0) {
        await socialService.unfollowUser(userId);
        setProfile({ ...profile, followersCount: profile.followersCount - 1 });
      } else {
        await socialService.followUser(userId);
        setProfile({ ...profile, followersCount: profile.followersCount + 1 });
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-innkt-primary"></div>
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
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="relative">
          {/* Cover Image Placeholder */}
          <div className="h-48 bg-gradient-to-r from-innkt-primary to-innkt-dark rounded-t-lg"></div>
          
          {/* Avatar Section */}
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-4xl text-gray-600">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {isOwnProfile && (
                <button
                  onClick={() => setShowAvatarUpload(true)}
                  className="absolute bottom-0 right-0 bg-innkt-primary text-white p-2 rounded-full hover:bg-innkt-dark transition-colors"
                >
                  📷
                </button>
              )}
            </div>
          </div>
          
          {/* Profile Actions */}
          <div className="absolute bottom-4 right-6 flex space-x-3">
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  profile.followersCount > 0
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-innkt-primary text-white hover:bg-innkt-dark'
                }`}
              >
                {profile.followersCount > 0 ? 'Following' : 'Follow'}
              </button>
            )}
            
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 bg-innkt-primary text-white rounded-full font-medium hover:bg-innkt-dark transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="pt-20 pb-6 px-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
                {profile.isVerified && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}
                {profile.isKidAccount && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    👶 Kid Account
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-2">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile.website && (
                  <div className="flex items-center space-x-1">
                    <span>🌐</span>
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-innkt-primary hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                
                {profile.dateOfBirth && (
                  <div className="flex items-center space-x-1">
                    <span>🎂</span>
                    <span>{getAge(profile.dateOfBirth)} years old</span>
                  </div>
                )}
              </div>
              
              {/* Social Stats */}
              <div className="flex space-x-8">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{profile.postsCount}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{profile.followersCount}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{profile.followingCount}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={editForm.displayName || ''}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="input-field"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={editForm.location || ''}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={editForm.website || ''}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleProfileUpdate}
              className="btn-primary px-6 py-2"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="btn-secondary px-6 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['posts', 'groups', 'followers', 'following'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-innkt-primary text-innkt-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            
            {profile.isVerified && (
              <button
                onClick={() => setActiveTab('blockchain')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'blockchain'
                    ? 'border-innkt-primary text-innkt-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Blockchain Posts
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No posts yet</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {post.authorProfile.avatar ? (
                          <img 
                            src={post.authorProfile.avatar} 
                            alt={post.authorProfile.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600">
                            {post.authorProfile.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {post.authorProfile.displayName}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>❤️ {post.likesCount}</span>
                          <span>💬 {post.commentsCount}</span>
                          <span>🔄 {post.sharesCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-4">
              {groups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No groups yet</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        {group.avatar ? (
                          <img 
                            src={group.avatar} 
                            alt={group.name}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 text-lg">
                            {group.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-600">{group.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{group.memberCount} members</span>
                          <span>{group.postCount} posts</span>
                          <span className={`px-2 py-1 rounded ${
                            group.type === 'public' ? 'bg-green-100 text-green-800' :
                            group.type === 'private' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {group.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="text-center py-8 text-gray-500">
              <p>Followers list will be implemented here</p>
            </div>
          )}

          {activeTab === 'following' && (
            <div className="text-center py-8 text-gray-500">
              <p>Following list will be implemented here</p>
            </div>
          )}

          {activeTab === 'blockchain' && profile.isVerified && (
            <div className="text-center py-8 text-gray-500">
              <p>Blockchain posts will be displayed here</p>
              <p className="text-sm mt-2">Posts with blockchain verification for enhanced trust</p>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Avatar</h3>
            
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="input-field"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAvatarUpload}
                disabled={!selectedFile}
                className="btn-primary flex-1"
              >
                Upload
              </button>
              <button
                onClick={() => {
                  setShowAvatarUpload(false);
                  setSelectedFile(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileComponent;



