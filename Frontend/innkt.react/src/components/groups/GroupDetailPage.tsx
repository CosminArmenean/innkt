import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socialService, Group, Post } from '../../services/social.service';
import { groupsService } from '../../services/groups.service';
import PostCard from '../social/PostCard';
import GroupDiscussion from './GroupDiscussion';
import GroupSettingsPanel from './GroupSettingsPanel';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserGroupIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  CogIcon,
  ShareIcon,
  BellIcon,
  BellSlashIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const GroupDetailPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  console.log('GroupDetailPage rendered for group ID:', id);
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'rules' | 'settings'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroup();
      loadPosts();
    }
  }, [id]);

  const loadGroup = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const groupData = await socialService.getGroup(id);
      setGroup(groupData);
    } catch (error) {
      console.error('Failed to load group:', error);
      navigate('/groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!id) return;
    
    try {
      const response = await groupsService.getGroupPosts(id, { limit: 20 });
      setPosts(response.posts);
    } catch (error) {
      console.error('Failed to load group posts:', error);
    }
  };

  const handleJoin = async () => {
    if (!group) return;
    
    setIsJoining(true);
    try {
      await socialService.joinGroup(group.id);
      setGroup(prev => prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null);
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!group) return;
    
    setIsLeaving(true);
    try {
      await socialService.leaveGroup(group.id);
      setGroup(prev => prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null);
    } catch (error) {
      console.error('Failed to leave group:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'private':
        return 'bg-yellow-100 text-yellow-800';
      case 'secret':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Group not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Group Header */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-purple-500 to-blue-500 relative">
          {group.coverImage && (
            <img 
              src={group.coverImage} 
              alt={group.name}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Group Type Badge */}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(group.type)}`}>
              {group.type}
            </span>
          </div>
        </div>

        {/* Group Info */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 -mt-10 border-4 border-white">
                {group.avatar ? (
                  <img 
                    src={group.avatar} 
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <UserGroupIcon className="w-10 h-10 text-gray-600" />
                  </div>
                )}
              </div>
              
              {/* Group Details */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
                <p className="text-gray-600 mb-2 capitalize">{group.category}</p>
                <p className="text-gray-700 mb-4">{group.description}</p>
                
                {/* Tags */}
                {group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {group.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="w-4 h-4" />
                    <span>{group.memberCount?.toLocaleString() || '0'} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span>{group.postCount || '0'} posts</span>
                  </div>
                  <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              {group.isMember ? (
                <>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                    <BellIcon className="w-4 h-4" />
                    <span>Notifications</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <ShareIcon className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  {(group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <CogIcon className="w-4 h-4" />
                      <span>Manage</span>
                    </button>
                  )}
                  <button
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {isLeaving ? 'Leaving...' : 'Leave Group'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isJoining ? 'Joining...' : 'Join Group'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'posts', label: 'Posts', count: posts.length },
              { id: 'members', label: 'Members', count: group.memberCount || 0 },
              { id: 'rules', label: 'Rules', count: group.rules?.length || 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
            
            {(group.memberRole === 'admin' || group.memberRole === 'moderator') && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'posts' && (
            <GroupDiscussion
              group={group}
              currentUserId={currentUserId}
            />
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Admins */}
                {group.admins.map((admin) => (
                  <div key={admin.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {admin.profile?.avatar ? (
                        <img src={admin.profile.avatar} alt={admin.profile.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-sm">{admin.profile?.displayName?.charAt(0) || 'U'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">{admin.profile?.displayName || 'Unknown User'}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor('admin')}`}>
                          Admin
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">@{admin.profile?.username || 'unknown'}</p>
                    </div>
                  </div>
                ))}
                
                {/* Moderators */}
                {group.moderators.map((moderator) => (
                  <div key={moderator.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {moderator.profile?.avatar ? (
                        <img src={moderator.profile.avatar} alt={moderator.profile.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-sm">{moderator.profile?.displayName?.charAt(0) || 'U'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">{moderator.profile?.displayName || 'Unknown User'}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor('moderator')}`}>
                          Moderator
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">@{moderator.profile?.username || 'unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              {(!group.rules || group.rules.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No rules set for this group.</p>
                </div>
              ) : (
                group.rules?.map((rule) => (
                  <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{rule.title}</h4>
                    <p className="text-gray-700">{rule.description}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <GroupSettingsPanel
              group={group}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
