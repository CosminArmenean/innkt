import React, { useState, useEffect } from 'react';
import { Group } from '../../services/social.service';
import { groupsService, TopicResponse, SubgroupResponse } from '../../services/groups.service';
import { 
  ChatBubbleLeftRightIcon, 
  PlusIcon,
  EyeIcon,
  UsersIcon,
  ClockIcon,
  TagIcon,
  MegaphoneIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  UserGroupIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import CreateAnnouncementModal from './CreateAnnouncementModal';
import TopicContent from './TopicContent';

interface TopicsListProps {
  group: Group;
  currentUserId?: string;
  onTopicCreated?: () => void;
}

const TopicsList: React.FC<TopicsListProps> = ({
  group,
  currentUserId,
  onTopicCreated
}) => {
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [subgroups, setSubgroups] = useState<SubgroupResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<TopicResponse | null>(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState<SubgroupResponse | null>(null);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [group.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [topicsData, subgroupsData] = await Promise.all([
        groupsService.getGroupTopics(group.id),
        groupsService.getGroupSubgroups(group.id)
      ]);
      setTopics(topicsData);
      setSubgroups(subgroupsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const topics = await groupsService.getGroupTopics(group.id);
      setTopics(topics);
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  const handleTopicSelect = (topic: TopicResponse) => {
    setSelectedTopic(topic);
    setSelectedSubgroup(null);
  };

  const handleSubgroupSelect = (subgroup: SubgroupResponse) => {
    setSelectedSubgroup(subgroup);
    setSelectedTopic(null);
  };

  const handleSubgroupToggle = (subgroupId: string) => {
    const newExpanded = new Set(expandedSubgroups);
    if (newExpanded.has(subgroupId)) {
      newExpanded.delete(subgroupId);
    } else {
      newExpanded.add(subgroupId);
    }
    setExpandedSubgroups(newExpanded);
  };

  const handleBackToGroup = () => {
    setSelectedSubgroup(null);
    setSelectedTopic(null);
  };

  const handleAnnouncementCreated = () => {
    setShowCreateAnnouncement(false);
    setSelectedTopic(null);
    loadTopics(); // Refresh topics
    onTopicCreated?.(); // Notify parent component to update counts
  };

  const handleUpdateTopicStatus = async (topicId: string, status: 'active' | 'paused') => {
    try {
      await groupsService.updateTopicStatus(group.id, topicId, status);
      loadTopics(); // Refresh topics to show updated status
    } catch (error) {
      console.error(`Failed to ${status} topic:`, error);
      alert(`Failed to ${status} topic. Please try again.`);
    }
  };

  const getTopicIcon = (topic: TopicResponse) => {
    if (topic.isAnnouncementOnly) {
      return <TagIcon className="w-5 h-5" />;
    }
    return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
  };

  const getTopicStatusColor = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If a topic is selected, show topic content
  if (selectedTopic) {
    return (
      <TopicContent
        topic={selectedTopic}
        group={group}
        currentUserId={currentUserId}
        onBack={() => {
          if (selectedSubgroup) {
            setSelectedTopic(null);
          } else {
            setSelectedTopic(null);
          }
        }}
        onPostCreated={() => {
          // Refresh topics count or handle post creation
          loadTopics();
        }}
      />
    );
  }

  // If a subgroup is selected, show subgroup topics
  if (selectedSubgroup) {
    return (
      <div className="space-y-6">
        {/* Subgroup Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToGroup}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedSubgroup.name}</h2>
                {selectedSubgroup.description && (
                  <p className="text-sm text-gray-500">{selectedSubgroup.description}</p>
                )}
              </div>
            </div>
          </div>
          {(group.memberRole === 'admin' || group.memberRole === 'moderator') && (
            <button
              onClick={() => setShowCreateAnnouncement(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Topic</span>
            </button>
          )}
        </div>

        {/* Subgroup Topics */}
        <div className="space-y-4">
          {topics.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No topics in this subgroup</h3>
              <p className="text-gray-500">Topics will appear here when created</p>
            </div>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                    {getTopicIcon(topic)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTopicStatusColor(topic.status)}`}>
                        {topic.status}
                      </span>
                    </div>
                    {topic.description && (
                      <p className="text-gray-600 text-sm mt-1">{topic.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center space-x-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>0 posts</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>Created {new Date(topic.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Group Topics</h2>
        </div>
        {(group.memberRole === 'admin' || group.memberRole === 'moderator') && (
          <button
            onClick={() => setShowCreateAnnouncement(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Topic</span>
          </button>
        )}
      </div>

      {/* Create Announcement Row */}
      {(group.memberRole === 'admin' || group.memberRole === 'moderator') && (
        <div 
          onClick={() => setShowCreateAnnouncement(true)}
          className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 cursor-pointer hover:from-purple-100 hover:to-blue-100 transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <MegaphoneIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                Create Announcement
              </h3>
              <p className="text-sm text-gray-600">
                Share important updates with the group
              </p>
            </div>
            <div className="flex items-center space-x-2 text-purple-600 group-hover:text-purple-700 transition-colors">
              <span className="text-sm font-medium">Create</span>
              <PlusIcon className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Tree Format Topics and Subgroups */}
      <div className="space-y-6">
        {/* Main Group Topics */}
        {topics.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Main Group Topics</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {topics.length}
              </span>
            </div>
            <div className="space-y-3">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => handleTopicSelect(topic)}
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                        {getTopicIcon(topic)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTopicStatusColor(topic.status)}`}>
                            {topic.status}
                          </span>
                        </div>
                        {topic.description && (
                          <p className="text-gray-600 text-sm mt-1">{topic.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                          <div className="flex items-center space-x-1">
                            <UsersIcon className="w-3 h-3" />
                            <span>{topic.postsCount || 0} posts</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {topic.allowMemberPosts && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Members</span>
                            )}
                            {topic.allowKidPosts && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">Kids</span>
                            )}
                            {topic.allowParentPosts && (
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">Parents</span>
                            )}
                            {topic.allowRolePosts && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">Roles</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Management Actions */}
                    {(group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                      <div className="flex items-center space-x-2">
                        {topic.status === 'active' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTopicStatus(topic.id, 'paused');
                            }}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                            title="Pause Topic"
                          >
                            <PauseIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTopicStatus(topic.id, 'active');
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Activate Topic"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Edit topic
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Edit Topic"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Delete topic
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Topic"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subgroups */}
        {subgroups.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Subgroups</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {subgroups.length}
              </span>
            </div>
            <div className="space-y-3">
              {subgroups.map((subgroup) => (
                <div
                  key={subgroup.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => handleSubgroupSelect(subgroup)}
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <UserGroupIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{subgroup.name}</h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {subgroup.isActive ? 'active' : 'inactive'}
                          </span>
                        </div>
                        {subgroup.description && (
                          <p className="text-gray-600 text-sm mt-1">{subgroup.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                          <div className="flex items-center space-x-1">
                            <UsersIcon className="w-3 h-3" />
                            <span>{subgroup.membersCount} members</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>Created {new Date(subgroup.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubgroupToggle(subgroup.id);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Toggle Topics"
                      >
                        {expandedSubgroups.has(subgroup.id) ? (
                          <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Subgroup Topics */}
                  {expandedSubgroups.has(subgroup.id) && (
                    <div className="mt-4 pl-14 space-y-2">
                      <div className="text-sm text-gray-500 mb-2">Topics in this subgroup:</div>
                      {/* TODO: Load and display subgroup topics */}
                      <div className="text-sm text-gray-400 italic">No topics in this subgroup yet</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {topics.length === 0 && subgroups.length === 0 && (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No topics or subgroups yet</h3>
            <p className="text-gray-500 mb-6">Create topics and subgroups to organize group discussions</p>
            {(group.memberRole === 'admin' || group.memberRole === 'moderator') && (
              <button
                onClick={() => setShowCreateAnnouncement(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create First Topic
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateAnnouncement && (
        <CreateAnnouncementModal
          group={group}
          selectedTopic={selectedTopic}
          selectedSubgroup={selectedSubgroup}
          topics={topics}
          currentUserId={currentUserId}
          onClose={() => {
            setShowCreateAnnouncement(false);
            setSelectedTopic(null);
          }}
          onAnnouncementCreated={handleAnnouncementCreated}
        />
      )}
    </div>
  );
};

export default TopicsList;
