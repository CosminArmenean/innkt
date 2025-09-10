import React, { useState, useEffect } from 'react';
import { socialService, UserProfile, Group, Post } from '../../services/social.service';
import UserProfileComponent from './UserProfile';
import PostCreation from './PostCreation';
import SocialFeed from './SocialFeed';
import LinkedAccountsPost from './LinkedAccountsPost';
import GroupChatButton from '../chat/GroupChatButton';
import GroupsPage from '../groups/GroupsPage';

interface SocialDashboardProps {
  currentUserId?: string;
}

const SocialDashboard: React.FC<SocialDashboardProps> = ({ currentUserId }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'groups' | 'discover' | 'messages'>('feed');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [recommendedUsers, setRecommendedUsers] = useState<UserProfile[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUserId) {
      loadCurrentUser();
      loadLinkedAccounts();
    }
    loadRecommendations();
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    if (!currentUserId) return;
    
    try {
      const user = await socialService.getUserProfile(currentUserId);
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLinkedAccounts = async () => {
    try {
      // TODO: Implement linked accounts API endpoint
      // For now, return empty array
      setLinkedAccounts([]);
    } catch (error) {
      console.error('Failed to load linked accounts:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const [users, topics] = await Promise.all([
        socialService.getRecommendedUsers(),
        socialService.getTrendingTopics()
      ]);
      setRecommendedUsers(users);
      setTrendingTopics(topics);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleStartGroupChat = (accountIds: string[]) => {
    console.log('Starting group chat with accounts:', accountIds);
    // Implement group chat logic
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-innkt-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Sidebar - Hidden on mobile, shown on lg+ */}
          <div className="hidden lg:block lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                  <span>✏️</span>
                  <span>Create Post</span>
                </button>
                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <span>👥</span>
                  <span>Create Group</span>
                </button>
                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <span>🔍</span>
                  <span>Search Users</span>
                </button>
                {linkedAccounts.length > 0 && (
                  <GroupChatButton
                    linkedAccounts={linkedAccounts}
                    onStartGroupChat={handleStartGroupChat}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            {/* Trending Topics */}
            {trendingTopics.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Trending Topics</h3>
                <div className="space-y-2">
                  {trendingTopics.slice(0, 8).map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm text-gray-700">#{topic}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Users */}
            {recommendedUsers.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Recommended Users</h3>
                <div className="space-y-3">
                  {recommendedUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-sm">
                              {user.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.displayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{user.username}
                        </div>
                      </div>
                      <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors">
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
              <nav className="flex space-x-0 overflow-x-auto">
                {[
                  { id: 'feed', label: 'Feed', icon: '📱' },
                  { id: 'profile', label: 'Profile', icon: '👤' },
                  { id: 'groups', label: 'Groups', icon: '👥' },
                  { id: 'discover', label: 'Discover', icon: '🔍' },
                  { id: 'messages', label: 'Messages', icon: '💬' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as typeof activeTab)}
                    className={`flex-1 min-w-0 flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm sm:text-base">{tab.icon}</span>
                    <span className="hidden xs:inline sm:inline truncate">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-4 sm:space-y-6">
              {activeTab === 'feed' && (
                <SocialFeed 
                linkedAccounts={linkedAccounts} 
                currentUserId={currentUser?.id}
              />
              )}
              
              {activeTab === 'profile' && currentUser && (
                <UserProfileComponent 
                  userId={currentUser.id} 
                  isOwnProfile={true}
                  currentUserId={currentUser.id}
                />
              )}
              
              {activeTab === 'groups' && (
                <GroupsPage currentUserId={currentUser?.id} />
              )}
              
              {activeTab === 'discover' && (
                <DiscoverTab />
              )}
              
              {activeTab === 'messages' && (
                <MessagesTab />
              )}
            </div>
          </div>

          {/* Right Sidebar - Hidden on mobile, shown on lg+ */}
          <div className="hidden lg:block lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Current User Stats */}
            {currentUser && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {currentUser.postsCount}
                    </div>
                    <div className="text-xs text-blue-600">Posts</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {currentUser.followersCount}
                    </div>
                    <div className="text-xs text-green-600">Followers</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {currentUser.followingCount}
                    </div>
                    <div className="text-xs text-purple-600">Following</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-600">New follower</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-600">Post liked</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-gray-600">Group joined</span>
                </div>
              </div>
            </div>

            {/* Quick Post */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Post</h3>
              <PostCreation onPostCreated={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder Components for Other Tabs
const GroupsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Groups</h2>
        <p className="text-sm text-gray-600">Join communities and connect with like-minded people</p>
      </div>
      <button className="btn-primary px-4 py-2">
        + Create Group
      </button>
    </div>
    
    <div className="text-center py-12 text-gray-500">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl text-gray-400">👥</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Groups feature coming soon</h3>
      <p>Create and manage groups, share posts, and collaborate with your community.</p>
    </div>
  </div>
);

const DiscoverTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Discover</h2>
        <p className="text-sm text-gray-600">Find new people, content, and trends</p>
      </div>
    </div>
    
    <div className="text-center py-12 text-gray-500">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl text-gray-400">🔍</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Discovery features coming soon</h3>
      <p>Search users, explore trending topics, and discover new content.</p>
    </div>
  </div>
);

const MessagesTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
        <p className="text-sm text-gray-600">Connect with friends and family through private messages</p>
      </div>
    </div>
    
    <div className="text-center py-12 text-gray-500">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl text-gray-400">💬</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Messaging coming soon</h3>
      <p>Send private messages, create group chats, and stay connected with your network.</p>
    </div>
  </div>
);

export default SocialDashboard;



