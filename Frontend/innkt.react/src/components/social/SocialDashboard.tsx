import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { socialService, UserProfile } from '../../services/social.service';
import UserProfileComponent from './UserProfile';
import SocialFeed from './SocialFeed';
import GroupsPage from '../groups/GroupsPage';
import MessagingDashboard from '../messaging/MessagingDashboard';
import PageLayout from '../layout/PageLayout';
import ScrollableContent from '../layout/ScrollableContent';

interface SocialDashboardProps {
  currentUserId?: string;
}

const SocialDashboard: React.FC<SocialDashboardProps> = ({ currentUserId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'groups' | 'discover' | 'messages'>('feed');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [recommendedUsers, setRecommendedUsers] = useState<UserProfile[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('SocialDashboard rendered - currentUserId:', currentUserId, 'activeTab:', activeTab);
  

  const loadCurrentUser = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      // Try to get current user profile first, fallback to getUserProfile
      let user;
      try {
        user = await socialService.getCurrentUserProfile();
      } catch (error) {
        console.log('getCurrentUserProfile failed, trying getUserProfile:', error);
        user = await socialService.getUserProfile(currentUserId);
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadCurrentUser();
      loadLinkedAccounts();
    }
    loadRecommendations();
  }, [currentUserId, loadCurrentUser]);

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

  const leftSidebar = (
    <div className="space-y-4 sm:space-y-6">
      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 {t('social.trendingTopics')}</h3>
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
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 {t('social.recommendedUsers')}</h3>
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
                  {t('social.follow')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const centerContent = (
    <div className="h-full">
      {activeTab === 'feed' && (
        <div className="h-full">
          <SocialFeed 
            linkedAccounts={linkedAccounts} 
            currentUserId={currentUser?.id}
          />
        </div>
      )}
      
      {activeTab === 'profile' && currentUser && (
        <div className="h-full">
          <UserProfileComponent 
            userId={currentUser.id} 
            isOwnProfile={true}
            currentUserId={currentUser.id}
          />
        </div>
      )}
      
      {activeTab === 'groups' && (
        <div className="h-full">
          <GroupsPage />
        </div>
      )}
      
      {activeTab === 'discover' && (
        <div className="h-full">
          <DiscoverTab />
        </div>
      )}
      
      {activeTab === 'messages' && (
        <div className="h-full">
          <MessagingDashboard />
        </div>
      )}
    </div>
  );

  const rightSidebar = (
    <div className="space-y-4 sm:space-y-6">
      {/* Right sidebar content can be added here */}
    </div>
  );

  return (
    <>
      {/* For feed tab, use MainLayout's natural scrolling - don't override */}
      {activeTab === 'feed' ? (
        // Let MainLayout handle the scrolling naturally
        centerContent
      ) : (
        <PageLayout
          leftSidebar={leftSidebar}
          centerContent={centerContent}
          rightSidebar={rightSidebar}
        />
      )}

      {/* Fixed Bottom Navigation Bar - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-gray-200 z-50">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
          <nav className="flex space-x-0 overflow-x-auto">
            {[
              { id: 'feed', label: t('social.feed'), icon: '📱' },
              { id: 'profile', label: t('nav.profile'), icon: '👤' },
              { id: 'groups', label: t('nav.groups'), icon: '👥' },
              { id: 'discover', label: t('social.discover'), icon: '🔍' },
              { id: 'messages', label: t('nav.messages'), icon: '💬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as typeof activeTab)}
                className={`flex-1 min-w-0 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

// Placeholder Components for Other Tabs

const DiscoverTab: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('social.discover')}</h2>
          <p className="text-sm text-gray-600">{t('social.findNewPeople')}</p>
        </div>
      </div>
      
      <div className="text-center py-12 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-gray-400">🔍</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('social.discoveryComingSoon')}</h3>
        <p>{t('social.searchUsersExplore')}</p>
      </div>
    </div>
  );
};


export default SocialDashboard;



