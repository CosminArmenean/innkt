import React, { useState, useEffect } from 'react';
import { groupsService, TopicResponse, SubgroupResponse } from '../../services/groups.service';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  PlayIcon,
  PauseIcon,
  UserGroupIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon as ChatBubbleIcon,
  PhotoIcon,
  ChartBarIcon,
  LockClosedIcon,
  MapPinIcon as PinIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

interface EnhancedTopicManagementPanelProps {
  groupId: string;
  groupName: string;
  currentUserId: string;
  onTopicCreated?: (topic: TopicResponse) => void;
  onTopicUpdated?: (topic: TopicResponse) => void;
  onTopicDeleted?: (topicId: string) => void;
}

interface TopicSettings {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isGlobalAudience?: boolean; // Only for main group topics
}

interface ExpandedTopic {
  id: string;
  isExpanded: boolean;
  settings: TopicSettings[];
}

const EnhancedTopicManagementPanel: React.FC<EnhancedTopicManagementPanelProps> = ({
  groupId,
  groupName,
  currentUserId,
  onTopicCreated,
  onTopicUpdated,
  onTopicDeleted
}) => {
  const [mainGroupTopics, setMainGroupTopics] = useState<TopicResponse[]>([]);
  const [subgroupTopics, setSubgroupTopics] = useState<{ [subgroupId: string]: TopicResponse[] }>({});
  const [subgroups, setSubgroups] = useState<SubgroupResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<{ [topicId: string]: ExpandedTopic }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'paused' | 'archived',
    isAnnouncementOnly: false,
    allowMemberPosts: true,
    allowKidPosts: false,
    allowParentPosts: true,
    allowRolePosts: true,
    isGlobalAudience: false // New field for main group topics
  });

  // Available settings that can be added to topics
  const availableSettings: TopicSettings[] = [
    // Posting Permissions
    {
      id: 'announcement-only',
      name: 'Announcement Only',
      description: 'Only admins and roles can post',
      icon: <ExclamationTriangleIcon className="h-4 w-4" />
    },
    {
      id: 'allow-member-posts',
      name: 'Allow Member Posts',
      description: 'Members can post in this topic',
      icon: <UserGroupIcon className="h-4 w-4" />
    },
    {
      id: 'allow-kid-posts',
      name: 'Allow Kid Posts',
      description: 'Kid accounts can post in this topic',
      icon: <UserGroupIcon className="h-4 w-4" />
    },
    {
      id: 'allow-parent-posts',
      name: 'Allow Parent Posts',
      description: 'Parent accounts can post in this topic',
      icon: <UserGroupIcon className="h-4 w-4" />
    },
    {
      id: 'allow-role-posts',
      name: 'Allow Role Posts',
      description: 'Role-based posting is enabled',
      icon: <UserGroupIcon className="h-4 w-4" />
    },
    {
      id: 'allow-anonymous',
      name: 'Allow Anonymous Posts',
      description: 'Users can post anonymously',
      icon: <UserIcon className="h-4 w-4" />
    },
    
    // Content Types
    {
      id: 'allow-comments',
      name: 'Allow Comments',
      description: 'Users can comment on posts',
      icon: <ChatBubbleIcon className="h-4 w-4" />
    },
    {
      id: 'allow-reactions',
      name: 'Allow Reactions',
      description: 'Users can react to posts',
      icon: <HeartIcon className="h-4 w-4" />
    },
    {
      id: 'allow-polls',
      name: 'Allow Polls',
      description: 'Users can create polls in this topic',
      icon: <ChartBarIcon className="h-4 w-4" />
    },
    {
      id: 'allow-media',
      name: 'Allow Media',
      description: 'Users can post images and videos',
      icon: <PhotoIcon className="h-4 w-4" />
    },
    
    // Moderation & Control
    {
      id: 'require-approval',
      name: 'Require Approval',
      description: 'Posts must be approved before appearing',
      icon: <ShieldCheckIcon className="h-4 w-4" />
    },
    {
      id: 'locked',
      name: 'Locked Topic',
      description: 'No new posts allowed (read-only)',
      icon: <LockClosedIcon className="h-4 w-4" />
    },
    {
      id: 'pinned',
      name: 'Pinned Topic',
      description: 'Keep this topic at the top',
      icon: <PinIcon className="h-4 w-4" />
    },
    
    // Visibility & Access
    {
      id: 'global-audience',
      name: 'Global Audience',
      description: 'Visible across all subgroups (Main Group only)',
      icon: <GlobeAltIcon className="h-4 w-4" />,
      isGlobalAudience: true
    },
    {
      id: 'auto-archive',
      name: 'Auto Archive',
      description: 'Automatically archive after inactivity',
      icon: <ArchiveBoxIcon className="h-4 w-4" />
    },
    
    // Scheduling & Timing
    {
      id: 'allow-scheduling',
      name: 'Allow Scheduling',
      description: 'Users can schedule posts for later',
      icon: <CalendarIcon className="h-4 w-4" />
    },
    {
      id: 'time-restricted',
      name: 'Time Restricted',
      description: 'Only allow posts during certain hours',
      icon: <ClockIcon className="h-4 w-4" />
    },
    
    // Notifications
    {
      id: 'mute-notifications',
      name: 'Mute Notifications',
      description: 'Disable notifications for this topic',
      icon: <SpeakerWaveIcon className="h-4 w-4" />
    },
    
    // Documentation
    {
      id: 'documentation-mode',
      name: 'Documentation Mode',
      description: 'Treat posts as documentation (editable)',
      icon: <DocumentTextIcon className="h-4 w-4" />
    }
  ];

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load main group topics
      const mainTopics = await groupsService.getGroupTopics(groupId, {});
      setMainGroupTopics(mainTopics.filter(topic => !topic.subgroupId));

      // Load subgroups
      const subgroupsResponse = await groupsService.getGroupSubgroups(groupId);
      setSubgroups(subgroupsResponse);

      // Load topics for each subgroup
      const subgroupTopicsMap: { [subgroupId: string]: TopicResponse[] } = {};
      for (const subgroup of subgroupsResponse) {
        // Get topics specific to this subgroup
        const subgroupSpecificTopics = await groupsService.getGroupTopics(groupId, { subgroupId: subgroup.id });
        
        // Get global audience topics from main group (should appear in all subgroups)
        const globalAudienceTopics = mainTopics.filter(topic => 
          !topic.subgroupId && topic.isGlobalAudience
        );
        
        // Combine subgroup-specific topics with global audience topics
        subgroupTopicsMap[subgroup.id] = [...subgroupSpecificTopics, ...globalAudienceTopics];
      }
      setSubgroupTopics(subgroupTopicsMap);
    } catch (error) {
      console.error('Failed to load topics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTopic = await groupsService.createTopic({
        groupId,
        subgroupId: undefined, // Main group topic
        name: formData.name,
        description: formData.description,
        status: formData.status,
        isAnnouncementOnly: formData.isAnnouncementOnly,
        allowMemberPosts: formData.allowMemberPosts,
        allowKidPosts: formData.allowKidPosts,
        allowParentPosts: formData.allowParentPosts,
        allowRolePosts: formData.allowRolePosts
      });
      
      setMainGroupTopics(prev => [...prev, newTopic]);
      onTopicCreated?.(newTopic);
      
      resetForm();
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;

    try {
      const updatedTopic = await groupsService.updateTopic(editingTopic.id, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        isAnnouncementOnly: formData.isAnnouncementOnly,
        allowMemberPosts: formData.allowMemberPosts,
        allowKidPosts: formData.allowKidPosts,
        allowParentPosts: formData.allowParentPosts,
        allowRolePosts: formData.allowRolePosts
      });
      
      // Update in the correct list
      if (editingTopic.subgroupId) {
        setSubgroupTopics(prev => ({
          ...prev,
          [editingTopic.subgroupId!]: prev[editingTopic.subgroupId!]?.map(topic => 
            topic.id === editingTopic.id ? updatedTopic : topic
          ) || []
        }));
      } else {
        setMainGroupTopics(prev => prev.map(topic => topic.id === editingTopic.id ? updatedTopic : topic));
      }
      
      onTopicUpdated?.(updatedTopic);
      setEditingTopic(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to update topic:', error);
    }
  };

  const handleDeleteTopic = async (topicId: string, isMainGroup: boolean) => {
    if (isMainGroup) {
      // Require admin approval for main group topics
      if (!window.confirm('Deleting main group topics requires admin approval. Are you sure you want to proceed?')) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
        return;
      }
    }

    try {
      await groupsService.deleteTopic(topicId);
      
      if (isMainGroup) {
        setMainGroupTopics(prev => prev.filter(topic => topic.id !== topicId));
      } else {
        // Find and remove from subgroup topics
        const newSubgroupTopics = { ...subgroupTopics };
        for (const subgroupId in newSubgroupTopics) {
          newSubgroupTopics[subgroupId] = newSubgroupTopics[subgroupId].filter(topic => topic.id !== topicId);
        }
        setSubgroupTopics(newSubgroupTopics);
      }
      
      onTopicDeleted?.(topicId);
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  };

  const handleEditTopic = (topic: TopicResponse) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name,
      description: topic.description || '',
      status: topic.status as 'active' | 'paused' | 'archived',
      isAnnouncementOnly: topic.isAnnouncementOnly,
      allowMemberPosts: topic.allowMemberPosts,
      allowKidPosts: topic.allowKidPosts,
      allowParentPosts: topic.allowParentPosts,
      allowRolePosts: topic.allowRolePosts,
      isGlobalAudience: false // TODO: Get this from topic data
    });
    setShowCreateForm(true);
  };

  const handleExpandTopic = (topicId: string, isMainGroup: boolean) => {
    const topic = isMainGroup 
      ? mainGroupTopics.find(t => t.id === topicId)
      : Object.values(subgroupTopics).flat().find(t => t.id === topicId);
    
    if (!topic) return;

    const currentSettings: TopicSettings[] = [];
    
    // Add current topic settings based on topic properties
    const settingMap: { [key: string]: boolean } = {
      'announcement-only': topic.isAnnouncementOnly,
      'allow-member-posts': topic.allowMemberPosts,
      'allow-kid-posts': topic.allowKidPosts,
      'allow-parent-posts': topic.allowParentPosts,
      'allow-role-posts': topic.allowRolePosts,
      'global-audience': isMainGroup && (topic.isGlobalAudience || false),
      'allow-comments': topic.allowComments || false,
      'allow-reactions': topic.allowReactions || false,
      'allow-polls': topic.allowPolls || false,
      'allow-media': topic.allowMedia || false,
      'require-approval': topic.requireApproval || false,
      'pinned': topic.isPinned || false,
      'locked': topic.isLocked || false,
      'allow-anonymous': topic.allowAnonymous || false,
      'auto-archive': topic.autoArchive || false,
      'allow-scheduling': topic.allowScheduling || false,
      'time-restricted': topic.timeRestricted || false,
      'mute-notifications': topic.muteNotifications || false,
      'documentation-mode': topic.documentationMode || false
    };

    // Add settings that are currently enabled
    Object.entries(settingMap).forEach(([settingId, isEnabled]) => {
      if (isEnabled) {
        const setting = availableSettings.find(s => s.id === settingId);
        if (setting) {
          currentSettings.push(setting);
        }
      }
    });

    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: {
        id: topicId,
        isExpanded: true,
        settings: currentSettings
      }
    }));
  };

  const handleCollapseTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        isExpanded: false
      }
    }));
  };

  const handleSaveTopicSettings = async (topicId: string) => {
    try {
      const expandedTopic = expandedTopics[topicId];
      if (!expandedTopic) return;

      // Find the topic
      const topic = mainGroupTopics.find(t => t.id === topicId) || 
                   Object.values(subgroupTopics).flat().find(t => t.id === topicId);
      
      if (!topic) return;

      // Convert settings back to topic properties
      const settings = expandedTopic.settings;
      const isMainGroup = !topic.subgroupId;

      const updates = {
        isAnnouncementOnly: settings.some(s => s.id === 'announcement-only'),
        allowMemberPosts: settings.some(s => s.id === 'allow-member-posts'),
        allowKidPosts: settings.some(s => s.id === 'allow-kid-posts'),
        allowParentPosts: settings.some(s => s.id === 'allow-parent-posts'),
        allowRolePosts: settings.some(s => s.id === 'allow-role-posts'),
        isGlobalAudience: isMainGroup && settings.some(s => s.id === 'global-audience'),
        // Additional settings
        allowComments: settings.some(s => s.id === 'allow-comments'),
        allowReactions: settings.some(s => s.id === 'allow-reactions'),
        allowPolls: settings.some(s => s.id === 'allow-polls'),
        allowMedia: settings.some(s => s.id === 'allow-media'),
        requireApproval: settings.some(s => s.id === 'require-approval'),
        isPinned: settings.some(s => s.id === 'pinned'),
        isLocked: settings.some(s => s.id === 'locked'),
        allowAnonymous: settings.some(s => s.id === 'allow-anonymous'),
        autoArchive: settings.some(s => s.id === 'auto-archive'),
        allowScheduling: settings.some(s => s.id === 'allow-scheduling')
      };

      // Update the topic
      const updatedTopic = await groupsService.updateTopic(topicId, updates, groupId);

      // Update in the correct list
      if (isMainGroup) {
        setMainGroupTopics(prev => prev.map(t => t.id === topicId ? updatedTopic : t));
      } else {
        setSubgroupTopics(prev => ({
          ...prev,
          [topic.subgroupId!]: prev[topic.subgroupId!]?.map(t => 
            t.id === topicId ? updatedTopic : t
          ) || []
        }));
      }

      // Collapse the topic
      handleCollapseTopic(topicId);
      
      onTopicUpdated?.(updatedTopic);
    } catch (error) {
      console.error('Failed to save topic settings:', error);
      alert('Failed to save topic settings. Please try again.');
    }
  };

  const handleAddSetting = (topicId: string, setting: TopicSettings) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        settings: [...prev[topicId].settings, setting]
      }
    }));
  };

  const handleRemoveSetting = (topicId: string, settingId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        settings: prev[topicId].settings.filter(s => s.id !== settingId)
      }
    }));
  };

  const getAvailableSettings = (topicId: string, isMainGroup: boolean) => {
    const currentSettings = expandedTopics[topicId]?.settings || [];
    const currentSettingIds = currentSettings.map(s => s.id);
    
    return availableSettings.filter(setting => {
      // Global audience only for main group topics
      if (setting.isGlobalAudience && !isMainGroup) return false;
      
      // Don't show already added settings
      return !currentSettingIds.includes(setting.id);
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
      isAnnouncementOnly: false,
      allowMemberPosts: true,
      allowKidPosts: false,
      allowParentPosts: true,
      allowRolePosts: true,
      isGlobalAudience: false
    });
    setShowCreateForm(false);
    setEditingTopic(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayIcon className="h-4 w-4 text-green-600" />;
      case 'paused': return <PauseIcon className="h-4 w-4 text-yellow-600" />;
      case 'archived': return <ArchiveBoxIcon className="h-4 w-4 text-gray-600" />;
      default: return <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderTopicCard = (topic: TopicResponse, isMainGroup: boolean) => {
    const isExpanded = expandedTopics[topic.id]?.isExpanded || false;
    const currentSettings = expandedTopics[topic.id]?.settings || [];

    return (
      <div key={topic.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
        {!isExpanded ? (
          // Collapsed view
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {topic.name}
                  </h4>
                  {topic.isAnnouncementOnly && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      Announcement Only
                    </span>
                  )}
                  {isMainGroup && formData.isGlobalAudience && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      <GlobeAltIcon className="h-3 w-3 mr-1" />
                      Global Audience
                    </span>
                  )}
                </div>
                {topic.description && (
                  <p className="text-sm text-gray-500 truncate">
                    {topic.description}
                  </p>
                )}
                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(topic.status)}`}>
                    {getStatusIcon(topic.status)}
                    <span className="ml-1 capitalize">{topic.status}</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <ChatBubbleLeftRightIcon className="h-3 w-3" />
                    <span>{topic.postsCount} posts</span>
                  </div>
                  <span>Created {new Date(topic.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExpandTopic(topic.id, isMainGroup)}
                className="p-2 text-gray-400 hover:text-purple-600"
                title="Edit topic settings"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteTopic(topic.id, isMainGroup)}
                className={`p-2 text-gray-400 hover:text-red-600 ${isMainGroup ? 'hover:text-orange-600' : ''}`}
                title={isMainGroup ? 'Delete topic (requires admin approval)' : 'Delete topic'}
              >
                {isMainGroup ? (
                  <ShieldCheckIcon className="h-4 w-4" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : (
          // Expanded view
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">{topic.name}</h4>
              <button
                onClick={() => handleCollapseTopic(topic.id)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Collapse"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Current Settings */}
              <div className="lg:col-span-2">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Current Settings</h5>
                <div className="space-y-2">
                  {currentSettings.length === 0 ? (
                    <p className="text-sm text-gray-500">No settings configured</p>
                  ) : (
                    currentSettings.map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          {setting.icon}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{setting.name}</div>
                            <div className="text-xs text-gray-500">{setting.description}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSetting(topic.id, setting.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Available Settings */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Available Settings</h5>
                <div className="space-y-2">
                  {getAvailableSettings(topic.id, isMainGroup).map((setting) => (
                    <button
                      key={setting.id}
                      onClick={() => handleAddSetting(topic.id, setting)}
                      className="w-full flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 text-left"
                    >
                      {setting.icon}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{setting.name}</div>
                        <div className="text-xs text-gray-500">{setting.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => handleSaveTopicSettings(topic.id)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Topics Management</h2>
          <p className="text-gray-600">Organize discussions with topics</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Create Topic
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTopic ? 'Edit Topic' : 'Create New Topic'}
          </h3>
          
          <form onSubmit={editingTopic ? handleUpdateTopic : handleCreateTopic} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Topic Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Enter topic name"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Enter topic description"
              />
            </div>

            {/* Global Audience setting for main group topics */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isGlobalAudience}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isGlobalAudience: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  Global Audience (visible across all subgroups)
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {editingTopic ? 'Update Topic' : 'Create Topic'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Topics Tree */}
      <div className="space-y-6">
        {/* Main Group Topics */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
            <span className="text-sm text-gray-500">({mainGroupTopics.length} topics)</span>
          </div>
          
          {mainGroupTopics.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No main group topics</h3>
              <p className="mt-1 text-sm text-gray-500">Create topics for the main group discussions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mainGroupTopics.map(topic => renderTopicCard(topic, true))}
            </div>
          )}
        </div>

        {/* Subgroup Topics */}
        {subgroups.map(subgroup => (
          <div key={subgroup.id}>
            <div className="flex items-center space-x-2 mb-4">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">{subgroup.name}</h3>
              <span className="text-sm text-gray-500">({subgroupTopics[subgroup.id]?.length || 0} topics)</span>
            </div>
            
            {(!subgroupTopics[subgroup.id] || subgroupTopics[subgroup.id].length === 0) ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subgroup topics</h3>
                <p className="mt-1 text-sm text-gray-500">This subgroup doesn't have any topics yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subgroupTopics[subgroup.id].map(topic => renderTopicCard(topic, false))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedTopicManagementPanel;
