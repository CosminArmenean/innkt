import React, { useState } from 'react';
import { XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import { groupsService, CreateTopicRequest, TopicResponse } from '../../services/groups.service';

interface CreateTopicModalProps {
  groupId: string;
  subgroupId?: string;
  currentUserId?: string;
  onClose: () => void;
  onTopicCreated: (topic: TopicResponse) => void;
}

const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
  groupId,
  subgroupId,
  currentUserId,
  onClose,
  onTopicCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Topic name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const topicData: CreateTopicRequest = {
        groupId,
        subgroupId,
        name: name.trim(),
        description: description.trim() || undefined,
        status: 'active',
        isAnnouncementOnly: false,
        allowMemberPosts: true,
        allowKidPosts: false,
        allowParentPosts: false,
        allowRolePosts: false
      };

      const newTopic = await groupsService.createTopic(topicData);
      onTopicCreated(newTopic);
      onClose();
    } catch (err) {
      console.error('Failed to create topic:', err);
      setError('Failed to create topic. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TagIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Topic</h2>
              <p className="text-sm text-gray-600">
                {subgroupId ? 'Create a topic in this subgroup' : 'Create a topic in this group'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="topic-name" className="block text-sm font-medium text-gray-700 mb-2">
              Topic Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="topic-name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter topic name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="topic-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="topic-description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter topic description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <TagIcon className="w-4 h-4" />
                <span>Create Topic</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTopicModal;
