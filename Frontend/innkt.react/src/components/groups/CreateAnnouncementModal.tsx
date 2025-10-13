import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Group } from '../../services/social.service';
import { TopicResponse, SubgroupResponse, groupsService } from '../../services/groups.service';
import { 
  XMarkIcon,
  MegaphoneIcon,
  TagIcon,
  UsersIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface CreateAnnouncementModalProps {
  group: Group;
  selectedTopic?: TopicResponse | null;
  selectedSubgroup?: SubgroupResponse | null;
  topics: TopicResponse[];
  currentUserId?: string;
  onClose: () => void;
  onAnnouncementCreated: () => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  group,
  selectedTopic,
  selectedSubgroup,
  topics,
  currentUserId,
  onClose,
  onAnnouncementCreated
}) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(selectedTopic?.id || null);
  const [audience, setAudience] = useState<'specific' | 'everyone'>('specific');
  const [isLoading, setIsLoading] = useState(false);
  
  // For topic creation in subgroups
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');

  const handleSubmit = async () => {
    if (selectedSubgroup) {
      // Creating a topic in a subgroup
      if (!topicName.trim()) {
        alert('Please enter a topic name');
        return;
      }
      
      setIsLoading(true);
      try {
        const topicRequest = {
          groupId: group.id,
          subgroupId: selectedSubgroup.id,
          name: topicName.trim(),
          description: topicDescription.trim() || undefined,
          status: 'active' as const,
          isAnnouncementOnly: false,
          allowMemberPosts: true,
          allowKidPosts: false,
          allowParentPosts: false,
          allowRolePosts: false
        };
        
        console.log('Creating topic in subgroup:', topicRequest);
        const newTopic = await groupsService.createTopic(topicRequest);
        console.log('Topic created successfully:', newTopic);
        
        onAnnouncementCreated();
      } catch (error) {
        console.error('Failed to create topic:', error);
        alert(t('groups.failedToCreateTopic'));
      } finally {
        setIsLoading(false);
      }
    } else {
      // Creating an announcement
      if (!content.trim()) {
        alert(t('groups.pleaseEnterAnnouncementContent'));
        return;
      }

      if (audience === 'specific' && !selectedTopicId) {
        alert(t('groups.pleaseSelectTopicForAnnouncement'));
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Implement announcement creation API call
        console.log('Creating announcement:', {
          content,
          topicId: selectedTopicId,
          audience,
          groupId: group.id
        });
        
        onAnnouncementCreated();
      } catch (error) {
        console.error('Failed to create announcement:', error);
        alert(t('groups.failedToCreateAnnouncement'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getTopicIcon = (topic: TopicResponse) => {
    if (topic.isAnnouncementOnly) {
      return <TagIcon className="w-4 h-4" />;
    }
    return <UsersIcon className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MegaphoneIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSubgroup ? t('groups.createTopicIn', { name: selectedSubgroup.name }) : t('groups.createAnnouncement')}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedSubgroup 
                  ? t('groups.createNewTopicWithinSubgroup')
                  : t('groups.shareImportantUpdates')
                }
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
        <div className="p-6 space-y-6">
          {selectedSubgroup ? (
            /* Topic Creation Form for Subgroups */
            <div className="space-y-4">
              <div>
                <label htmlFor="topic-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="topic-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter topic name"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
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
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            /* Announcement Creation Form */
            <div>
              {/* Audience Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('groups.audience')}</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="audience"
                      value="specific"
                      checked={audience === 'specific'}
                      onChange={(e) => setAudience(e.target.value as 'specific')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center space-x-2">
                      <TagIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">{t('groups.specificTopic')}</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="audience"
                      value="everyone"
                      checked={audience === 'everyone'}
                      onChange={(e) => setAudience(e.target.value as 'everyone')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center space-x-2">
                      <UserGroupIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">{t('groups.everyoneAllTopics')}</span>
                    </div>
                  </label>
                </div>
              </div>

          {/* Topic Selection */}
          {audience === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('groups.selectTopic')}</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {topics.map((topic) => (
                  <label
                    key={topic.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTopicId === topic.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="topic"
                      value={topic.id}
                      checked={selectedTopicId === topic.id}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-purple-600">
                        {getTopicIcon(topic)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{topic.name}</div>
                        {topic.description && (
                          <div className="text-xs text-gray-500 truncate">{topic.description}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {topic.allowMemberPosts && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">M</span>
                        )}
                        {topic.allowKidPosts && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">K</span>
                        )}
                        {topic.allowParentPosts && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">P</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('groups.announcementContent')}</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('groups.whatToAnnounce')}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Access Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">{t('groups.accessInformation')}</p>
                    <p>
                      {audience === 'everyone' 
                        ? t('groups.announcementVisibleToAll')
                        : selectedTopicId 
                          ? t('groups.announcementPostedToTopic')
                          : t('groups.pleaseSelectTopicToPost')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isLoading || 
              (selectedSubgroup ? !topicName.trim() : (!content.trim() || (audience === 'specific' && !selectedTopicId)))
            }
            className={`px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 ${
              selectedSubgroup ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('groups.creating')}</span>
              </>
            ) : (
              <>
                {selectedSubgroup ? (
                  <>
                    <TagIcon className="w-4 h-4" />
                    <span>{t('groups.createTopicButton')}</span>
                  </>
                ) : (
                  <>
                    <MegaphoneIcon className="w-4 h-4" />
                    <span>{t('groups.createAnnouncement')}</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
