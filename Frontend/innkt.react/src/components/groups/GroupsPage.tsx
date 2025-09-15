import React, { useState, useEffect } from 'react';
import { socialService, Group } from '../../services/social.service';
import GroupCard from './GroupCard';
import CreateGroupModal from './CreateGroupModal';
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PageLayout from '../layout/PageLayout';
import ScrollableContent from '../layout/ScrollableContent';

interface GroupsPageProps {
  currentUserId?: string;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ currentUserId }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'recommended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    sortBy: 'popular'
  });

  useEffect(() => {
    loadGroups();
    loadMyGroups();
    loadRecommendedGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const response = await socialService.getGroups({
        search: searchQuery,
        category: filters.category,
        type: filters.type as any,
        limit: 20
      });
      setGroups(response.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyGroups = async () => {
    try {
      const response = await socialService.getGroups({
        search: '',
        limit: 20
      });
      // Filter groups where user is a member
      const userGroups = response.groups.filter(group => group.isMember);
      setMyGroups(userGroups);
    } catch (error) {
      console.error('Failed to load my groups:', error);
    }
  };

  const loadRecommendedGroups = async () => {
    try {
      const recommended = await socialService.getRecommendedGroups();
      setRecommendedGroups(recommended);
    } catch (error) {
      console.error('Failed to load recommended groups:', error);
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
      await socialService.joinGroup(groupId);
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
      await socialService.leaveGroup(groupId);
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
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          {['Technology', 'Business', 'Education', 'Entertainment', 'Lifestyle', 'Sports', 'Health', 'Travel'].map((category) => (
            <button
              key={category}
              onClick={() => setFilters(prev => ({ ...prev, category: category.toLowerCase() }))}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Groups</h1>
          <p className="text-gray-600">Discover and join communities that interest you</p>
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
                placeholder="Search groups..."
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
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="sports">Sports</option>
                  <option value="health">Health</option>
                  <option value="travel">Travel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Types</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="secret">Secret</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="recent">Most Recent</option>
                  <option value="members">Most Members</option>
                  <option value="activity">Most Active</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex-shrink-0">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: 'All Groups', count: groups.length },
            { id: 'my', label: 'My Groups', count: myGroups.length },
            { id: 'recommended', label: 'Recommended', count: recommendedGroups.length }
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCurrentGroups().map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                currentUserId={currentUserId}
                onJoin={handleJoinGroup}
                onLeave={handleLeaveGroup}
              />
            ))}
          </div>
        )}

        {!isLoading && getCurrentGroups().length === 0 && (
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
      <PageLayout
        leftSidebar={leftSidebar}
        centerContent={centerContent}
        layoutType="wide-right"
      />

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
