import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { socialService, Post } from '../../services/social.service';
import { MegaphoneIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';

interface GroupAnnouncementProps {
  groupId: string;
  groupName: string;
  currentUserId?: string;
  userRole?: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  onAnnouncementCreated?: (post: Post) => void;
  className?: string;
}

const GroupAnnouncement: React.FC<GroupAnnouncementProps> = ({
  groupId,
  groupName,
  currentUserId,
  userRole,
  onAnnouncementCreated,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canCreateAnnouncements = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator';

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert(t('messaging.pleaseEnterAnnouncementContentAlert'));
      return;
    }

    setIsLoading(true);
    try {
      const postData = {
        content: content.trim(),
        postType: 'text' as const,
        visibility: 'group' as const,
        groupId: groupId,
        tags: ['announcement', 'important']
      };

      const newPost = await socialService.createPost(postData);
      
      setContent('');
      setIsCreating(false);
      
      if (onAnnouncementCreated) {
        onAnnouncementCreated(newPost);
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert(t('messaging.failedToCreateAnnouncementAlert'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCreateAnnouncements) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      {!isCreating ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <MegaphoneIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{t('groups.createAnnouncement')}</h3>
              <p className="text-sm text-gray-600">{t('messaging.shareImportantUpdatesWithGroup')}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MegaphoneIcon className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">New Announcement</h3>
            </div>
            <button
              onClick={() => {
                setIsCreating(false);
                setContent('');
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share important updates, events, or information with the group..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>📢</span>
              <span>This will be marked as an announcement</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setContent('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupAnnouncement;
