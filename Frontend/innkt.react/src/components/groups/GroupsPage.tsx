import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { socialService, Group } from '../../services/social.service';
import { groupsService, EnhancedGroupResponse } from '../../services/groups.service';
import GroupCard from './GroupCard';
import CreateGroupModal from './CreateGroupModal';
import GroupManagementPanel from './GroupManagementPanel';
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PageLayout from '../layout/PageLayout';
import ScrollableContent from '../layout/ScrollableContent';
import { useAuth } from '../../contexts/AuthContext';

const GroupsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const currentUserId = user?.id;
  
  console.log('GroupsPage rendered - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'currentUserId:', currentUserId);
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'recommended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    sortBy: 'popular'
  });

  useEffect(() => {
    console.log('GroupsPage useEffect - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'currentUserId:', currentUserId);
    
    // Wait for authentication to complete
    if (isLoading) {
      console.log('GroupsPage useEffect - still loading, skipping API calls');
      return;
    }

    console.log('GroupsPage useEffect - loading groups');
    loadGroups();
    
    // Check if we have a valid token
    const token = localStorage.getItem('accessToken');
    console.log('GroupsPage useEffect - token exists:', !!token);
    
    // Only load user-specific data if user is authenticated and has a token
    if (isAuthenticated && currentUserId && currentUserId !== 'undefined' && currentUserId !== 'null' && token) {
      console.log('GroupsPage useEffect - user authenticated with token, loading user-specific data');
      loadMyGroups();
      loadRecommendedGroups();
    } else {
      console.log('GroupsPage useEffect - user not authenticated or no token, clearing user-specific data');
      // Clear user-specific data if not authenticated
      setMyGroups([]);
      setRecommendedGroups([]);
    }
  }, [isLoading, isAuthenticated, currentUserId]);

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    console.log('GroupsPage - showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this page shouldn't be accessible (should be handled by ProtectedRoute)
  // But add a safety check just in case
  if (!isAuthenticated || !currentUserId) {
    console.warn('GroupsPage rendered without authentication - this should not happen with ProtectedRoute');
    console.warn('GroupsPage - isAuthenticated:', isAuthenticated, 'currentUserId:', currentUserId);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('groups.authenticationRequired')}</h2>
          <p className="text-gray-600">{t('groups.pleaseLoginToAccess')}</p>
        </div>
      </div>
    );
  }

  const loadGroups = async () => {
    try {
      setIsPageLoading(true);
      console.log('Loading groups with currentUserId:', currentUserId);
      
      // Only pass currentUserId if user is authenticated
      const requestParams: any = {
        search: searchQuery,
        category: filters.category,
        type: filters.type as any,
        limit: 20
      };
      
      if (isAuthenticated && currentUserId && currentUserId !== 'undefined' && currentUserId !== 'null') {
        requestParams.currentUserId = currentUserId;
      }
      
      const response = await groupsService.getGroups(requestParams);
      console.log('Groups loaded successfully:', response);
      setGroups(response.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      // Set empty groups on error to prevent infinite loading
      setGroups([]);
    } finally {
      setIsPageLoading(false);
    }
  };

  const loadMyGroups = async () => {
    console.log('loadMyGroups called - isAuthenticated:', isAuthenticated, 'currentUserId:', currentUserId);
    
    // Check if we have a valid token
    const token = localStorage.getItem('accessToken');
    console.log('loadMyGroups - token exists:', !!token);
    
    if (!isAuthenticated || !currentUserId || currentUserId === 'undefined' || currentUserId === 'null' || !token) {
      console.log('loadMyGroups: Not authenticated, no currentUserId, or no token - skipping');
      setMyGroups([]);
      return;
    }
    
    try {
      console.log('loadMyGroups: Loading groups for user:', currentUserId);
      const response = await groupsService.getUserGroups(currentUserId, {
        page: 1,
        limit: 20
      });
      console.log('loadMyGroups: Successfully loaded groups:', response.groups.length);
      setMyGroups(response.groups);
    } catch (error: any) {
      console.error('Failed to load my groups:', error);
      
      // Handle 401 errors gracefully - JWT validation might be failing in Groups service
      if (error?.status === 401) {
        console.log('loadMyGroups: 401 error - Groups service JWT validation failed, showing empty groups');
        // Don't clear token or refresh - just show empty groups
        // The token is valid for other services, just Groups service has JWT validation issues
        setMyGroups([]);
        return;
      }
      
      setMyGroups([]);
      // Don't throw the error, just log it and continue
    }
  };

  const loadRecommendedGroups = async () => {
    try {
      // Check if we have a valid token
      const token = localStorage.getItem('accessToken');
      
      // Only load recommended groups if user is authenticated
      if (isAuthenticated && currentUserId && currentUserId !== 'undefined' && currentUserId !== 'null' && token) {
        const recommended = await socialService.getRecommendedGroups();
        setRecommendedGroups(recommended);
      } else {
        setRecommendedGroups([]);
      }
    } catch (error: any) {
      console.error('Failed to load recommended groups:', error);
      
      // Handle 401 errors gracefully - JWT validation might be failing in Groups service
      if (error?.status === 401) {
        console.log('loadRecommendedGroups: 401 error - Groups service JWT validation failed, showing empty recommended groups');
        setRecommendedGroups([]);
        return;
      }
      
      setRecommendedGroups([]);
    }
  };

  const handleSearch = () => {
    loadGroups();
  };

  const handleGroupCreated = (newGroup: Group) => {
    setGroups(prev => [newGroup, ...prev]);
    setMyGroups(prev => [newGroup, ...prev]);
    setShowCreateModal(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await groupsService.joinGroup(groupId);
      // Update the group in all lists
      const updateGroup = (group: Group) => 
        group.id === groupId ? { ...group, isMember: true, memberCount: group.memberCount + 1 } : group;
      
      setGroups(prev => prev.map(updateGroup));
      setMyGroups(prev => prev.map(updateGroup));
      setRecommendedGroups(prev => prev.map(updateGroup));
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await groupsService.leaveGroup(groupId);
      // Update the group in all lists
      const updateGroup = (group: Group) => 
        group.id === groupId ? { ...group, isMember: false, memberCount: group.memberCount - 1 } : group;
      
      setGroups(prev => prev.map(updateGroup));
      setMyGroups(prev => prev.filter(group => group.id !== groupId));
      setRecommendedGroups(prev => prev.map(updateGroup));
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  const handleManageGroup = (groupId: string) => {
    const group = [...groups, ...myGroups, ...recommendedGroups].find(g => g.id === groupId);
    if (group) {
      setSelectedGroup(group);
    }
  };

  const handleCloseManagement = () => {
    setSelectedGroup(null);
  };

  const getCurrentGroups = () => {
    switch (activeTab) {
      case 'my':
        return myGroups;
      case 'recommended':
        return recommendedGroups;
      default:
        return groups;
    }
  };

  const getCurrentTitle = () => {
    switch (activeTab) {
      case 'my':
        return 'My Groups';
      case 'recommended':
        return 'Recommended Groups';
      default:
        return 'All Groups';
    }
  };

  const leftSidebar = (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div>
        <h3 className="font-medium text-gray-900 mb-2 text-sm">{t('dashboard.quickActions')}</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center space-x-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          <PlusIcon className="h-4 w-4" />
          <span>{t('groups.createGroup')}</span>
        </button>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-medium text-gray-900 mb-2 text-sm">{t('groups.category')}</h3>
        <div className="space-y-1">
          {['Technology', 'Business', 'Education', 'Entertainment', 'Lifestyle', 'Sports', 'Health', 'Travel'].map((category) => (
            <button
              key={category}
              onClick={() => setFilters(prev => ({ ...prev, category: category.toLowerCase() }))}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                filters.category === category.toLowerCase()
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const centerContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('groups.exploreGroups')}</h1>
          <p className="text-gray-600">{t('groups.discoverCommunities')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('groups.searchGroups')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>{t('groups.filters')}</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('groups.category')}</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('groups.allCategories')}</option>
                  <option value="technology">{t('groups.technology')}</option>
                  <option value="business">{t('groups.business')}</option>
                  <option value="education">{t('groups.education')}</option>
                  <option value="entertainment">{t('groups.entertainment')}</option>
                  <option value="lifestyle">{t('groups.lifestyle')}</option>
                  <option value="sports">{t('groups.sports')}</option>
                  <option value="health">{t('groups.health')}</option>
                  <option value="travel">{t('groups.travel')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('groups.type')}</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('groups.allTypes')}</option>
                  <option value="public">{t('groups.public')}</option>
                  <option value="private">{t('groups.private')}</option>
                  <option value="secret">{t('groups.secret')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('groups.sortBy')}</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="popular">{t('groups.mostPopular')}</option>
                  <option value="recent">{t('groups.mostRecent')}</option>
                  <option value="members">{t('groups.mostMembers')}</option>
                  <option value="activity">{t('groups.mostActive')}</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('groups.applyFilters')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex-shrink-0">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: t('groups.allGroups'), count: groups.length },
            { id: 'my', label: t('groups.myGroups'), count: myGroups.length },
            { id: 'recommended', label: t('groups.recommended'), count: recommendedGroups.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Groups Grid */}
      <ScrollableContent>
        {isPageLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {getCurrentGroups().map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                currentUserId={currentUserId}
                onJoin={handleJoinGroup}
                onLeave={handleLeaveGroup}
                onManage={handleManageGroup}
              />
            ))}
          </div>
        )}

        {!isPageLoading && getCurrentGroups().length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'my' 
                ? "You haven't joined any groups yet. Explore groups below!"
                : "Try adjusting your search or filters to find more groups."
              }
            </p>
            {activeTab === 'my' && (
              <button
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Explore Groups
              </button>
            )}
          </div>
        )}
      </ScrollableContent>
    </div>
  );

  return (
    <>
      {selectedGroup ? (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <button
                onClick={handleCloseManagement}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                ← Back to Groups
              </button>
            </div>
            <GroupManagementPanel
              group={selectedGroup}
              currentUserId={currentUserId}
              onSubgroupCreated={() => {
                // Refresh groups data
                loadGroups();
                loadMyGroups();
              }}
            />
          </div>
        </div>
      ) : (
        <PageLayout
          leftSidebar={leftSidebar}
          centerContent={centerContent}
          layoutType="wide-right"
        />
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </>
  );
};

export default GroupsPage;
