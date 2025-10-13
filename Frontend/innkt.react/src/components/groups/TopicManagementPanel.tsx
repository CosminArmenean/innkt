import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsService, TopicResponse } from '../../services/groups.service';
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
  PauseIcon
} from '@heroicons/react/24/outline';

interface TopicManagementPanelProps {
  groupId: string;
  subgroupId?: string;
  currentUserId: string;
  onTopicCreated?: (topic: TopicResponse) => void;
  onTopicUpdated?: (topic: TopicResponse) => void;
  onTopicDeleted?: (topicId: string) => void;
}

interface CreateTopicFormData {
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  isAnnouncementOnly: boolean;
  allowMemberPosts: boolean;
  allowKidPosts: boolean;
  allowParentPosts: boolean;
  allowRolePosts: boolean;
}

const TopicManagementPanel: React.FC<TopicManagementPanelProps> = ({
  groupId,
  subgroupId,
  currentUserId,
  onTopicCreated,
  onTopicUpdated,
  onTopicDeleted
}) => {
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicResponse | null>(null);
  const [formData, setFormData] = useState<CreateTopicFormData>({
    name: '',
    description: '',
    status: 'active',
    isAnnouncementOnly: false,
    allowMemberPosts: true,
    allowKidPosts: false,
    allowParentPosts: true,
    allowRolePosts: true
  });

  useEffect(() => {
    loadTopics();
  }, [groupId, subgroupId]);

  const loadTopics = async () => {
    try {
      setIsLoading(true);
      const response = await groupsService.getGroupTopics(groupId, {
        subgroupId: subgroupId
      });
      setTopics(response);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTopic = await groupsService.createTopic({
        groupId,
        subgroupId: subgroupId,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        isAnnouncementOnly: formData.isAnnouncementOnly,
        allowMemberPosts: formData.allowMemberPosts,
        allowKidPosts: formData.allowKidPosts,
        allowParentPosts: formData.allowParentPosts,
        allowRolePosts: formData.allowRolePosts
      });
      
      setTopics(prev => [...prev, newTopic]);
      onTopicCreated?.(newTopic);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'active',
        isAnnouncementOnly: false,
        allowMemberPosts: true,
        allowKidPosts: false,
        allowParentPosts: true,
        allowRolePosts: true
      });
      setShowCreateForm(false);
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
      
      setTopics(prev => prev.map(topic => topic.id === editingTopic.id ? updatedTopic : topic));
      onTopicUpdated?.(updatedTopic);
      
      setEditingTopic(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to update topic:', error);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!window.confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return;
    }

    try {
      await groupsService.deleteTopic(topicId);
      setTopics(prev => prev.filter(topic => topic.id !== topicId));
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
      allowRolePosts: topic.allowRolePosts
    });
    setShowCreateForm(true);
  };

  const handleToggleTopicStatus = async (topicId: string, currentStatus: string) => {
    try {
      let newStatus: 'active' | 'paused' | 'archived';
      switch (currentStatus) {
        case 'active':
          newStatus = 'paused';
          break;
        case 'paused':
          newStatus = 'active';
          break;
        default:
          newStatus = 'active';
      }

      const updatedTopic = await groupsService.updateTopic(topicId, { status: newStatus });
      setTopics(prev => prev.map(topic => topic.id === topicId ? updatedTopic : topic));
    } catch (error) {
      console.error('Failed to update topic status:', error);
    }
  };

  const cancelEdit = () => {
    setEditingTopic(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      isAnnouncementOnly: false,
      allowMemberPosts: true,
      allowKidPosts: false,
      allowParentPosts: true,
      allowRolePosts: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4 text-yellow-600" />;
      case 'archived':
        return <ArchiveBoxIcon className="h-4 w-4 text-gray-600" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-600" />;
    }
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
          <p className="text-gray-600">
            {subgroupId ? 'Manage topics within this subgroup' : 'Organize discussions with topics'}
          </p>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTopic ? 'Edit Topic' : 'Create New Topic'}
          </h3>
          
          <form onSubmit={editingTopic ? handleUpdateTopic : handleCreateTopic} className="space-y-4">
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

            {/* Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Posting Permissions</h4>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAnnouncementOnly}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isAnnouncementOnly: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Announcement only (admins/roles can post)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowMemberPosts}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      allowMemberPosts: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow members to post</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowKidPosts}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      allowKidPosts: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow kid accounts to post</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowParentPosts}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      allowParentPosts: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow parent accounts to post</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowRolePosts}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      allowRolePosts: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow role-based posting</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
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

      {/* Topics List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Existing Topics</h3>
        </div>
        
        {topics.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No topics</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new topic for discussions.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Topic
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {topics.map((topic) => (
              <div key={topic.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600" />
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
                        </div>
                        {topic.description && (
                          <p className="text-sm text-gray-500 truncate">
                            {topic.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(topic.status)}`}>
                              {getStatusIcon(topic.status)}
                              <span className="ml-1 capitalize">{topic.status}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ChatBubbleLeftRightIcon className="h-3 w-3" />
                            <span>{topic.postsCount} posts</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Created {new Date(topic.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleTopicStatus(topic.id, topic.status)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title={`${topic.status === 'active' ? 'Pause' : 'Activate'} topic`}
                    >
                      {topic.status === 'active' ? (
                        <PauseIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditTopic(topic)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Edit topic"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete topic"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicManagementPanel;


