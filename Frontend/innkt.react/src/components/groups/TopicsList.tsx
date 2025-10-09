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
import CreateTopicModal from './CreateTopicModal';
import TopicContent from './TopicContent';

interface TopicsListProps {
  group: Group;
  currentUserId?: string;
  onTopicCreated?: () => void;
  onSubgroupViewChange?: (subgroup: SubgroupResponse | null) => void;
  currentSubgroup?: SubgroupResponse | null;
}

const TopicsList: React.FC<TopicsListProps> = ({
  group,
  currentUserId,
  onTopicCreated,
  onSubgroupViewChange,
  currentSubgroup
}) => {
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [subgroups, setSubgroups] = useState<SubgroupResponse[]>([]);
  const [subgroupTopics, setSubgroupTopics] = useState<Map<string, TopicResponse[]>>(new Map());
  const [subgroupTopicCounts, setSubgroupTopicCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<TopicResponse | null>(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState<SubgroupResponse | null>(null);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set());

  // Sync internal selectedSubgroup with external currentSubgroup prop
  useEffect(() => {
    setSelectedSubgroup(currentSubgroup || null);
  }, [currentSubgroup]);

  useEffect(() => {
    loadData();
  }, [group.id, selectedSubgroup]);

  // Notify parent when subgroup view changes
  useEffect(() => {
    if (onSubgroupViewChange) {
      onSubgroupViewChange(selectedSubgroup);
    }
  }, [selectedSubgroup, onSubgroupViewChange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 TopicsList loadData called with selectedSubgroup:', selectedSubgroup);
      
      if (selectedSubgroup) {
        // Load only subgroup topics when a subgroup is selected
        console.log('📚 Loading subgroup topics for:', selectedSubgroup.name, selectedSubgroup.id);
        const subgroupTopicsData = await groupsService.getGroupTopics(group.id, { subgroupId: selectedSubgroup.id });
        console.log('📚 Subgroup topics loaded:', subgroupTopicsData);
        setTopics(subgroupTopicsData);
      } else {
        // Load main group topics and subgroups when no subgroup is selected
        console.log('🏠 Loading main group topics');
        const [topicsData, subgroupsData] = await Promise.all([
          groupsService.getGroupTopics(group.id),
          groupsService.getGroupSubgroups(group.id)
        ]);
        console.log('🏠 Main group topics loaded:', topicsData);
        setTopics(topicsData);
        setSubgroups(subgroupsData);
        
        // Load topic counts for all subgroups
        await loadSubgroupTopicCounts(subgroupsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubgroupTopicCounts = async (subgroups: SubgroupResponse[]) => {
    try {
      const counts = new Map<string, number>();
      const topics = new Map<string, TopicResponse[]>();
      
      // Load topics for each subgroup in parallel
      const subgroupTopicPromises = subgroups.map(async (subgroup) => {
        try {
          const subgroupTopicsData = await groupsService.getGroupTopics(group.id, { subgroupId: subgroup.id });
          counts.set(subgroup.id, subgroupTopicsData.length);
          topics.set(subgroup.id, subgroupTopicsData);
        } catch (error) {
          console.error(`Failed to load topics for subgroup ${subgroup.id}:`, error);
          counts.set(subgroup.id, 0);
          topics.set(subgroup.id, []);
        }
      });
      
      await Promise.all(subgroupTopicPromises);
      setSubgroupTopicCounts(counts);
      setSubgroupTopics(topics);
    } catch (error) {
      console.error('Failed to load subgroup topic counts:', error);
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

  const loadSubgroupTopics = async (subgroupId: string) => {
    try {
      const topics = await groupsService.getGroupTopics(group.id, { subgroupId });
      setTopics(topics);
    } catch (error) {
      console.error('Failed to load subgroup topics:', error);
    }
  };

  const handleTopicSelect = (topic: TopicResponse) => {
    setSelectedTopic(topic);
    setSelectedSubgroup(null);
  };

  const handleSubgroupSelect = (subgroup: SubgroupResponse) => {
    setSelectedSubgroup(subgroup);
    setSelectedTopic(null);
    loadSubgroupTopics(subgroup.id);
  };

  const handleSubgroupToggle = async (subgroupId: string) => {
    const newExpanded = new Set(expandedSubgroups);
    if (newExpanded.has(subgroupId)) {
      newExpanded.delete(subgroupId);
    } else {
      newExpanded.add(subgroupId);
      // Load topics for this subgroup if not already loaded
      if (!subgroupTopics.has(subgroupId)) {
        try {
          const subgroupTopicsData = await groupsService.getGroupTopics(group.id, { subgroupId });
          setSubgroupTopics(prev => new Map(prev).set(subgroupId, subgroupTopicsData));
        } catch (error) {
          console.error(`Failed to load topics for subgroup ${subgroupId}:`, error);
        }
      }
    }
    setExpandedSubgroups(newExpanded);
  };

  const handleBackToGroup = () => {
    setSelectedSubgroup(null);
    setSelectedTopic(null);
    setTopics([]); // Clear current topics first
    loadTopics(); // Reload main group topics
  };

  const handleAnnouncementCreated = () => {
    setShowCreateAnnouncement(false);
    setSelectedTopic(null);
    // Refresh topics based on current view
    if (selectedSubgroup) {
      loadSubgroupTopics(selectedSubgroup.id);
      // Also refresh the subgroup topic counts
      loadSubgroupTopicCounts(subgroups);
    } else {
      loadTopics();
      // Refresh subgroup topic counts
      loadSubgroupTopicCounts(subgroups);
    }
    onTopicCreated?.(); // Notify parent component to update counts
  };

  const handleTopicCreated = () => {
    setShowCreateTopic(false);
    setSelectedTopic(null);
    // Refresh topics based on current view
    if (selectedSubgroup) {
      loadSubgroupTopics(selectedSubgroup.id);
      // Also refresh the subgroup topic counts
      loadSubgroupTopicCounts(subgroups);
    } else {
      loadTopics();
      // Refresh subgroup topic counts
      loadSubgroupTopicCounts(subgroups);
    }
    onTopicCreated?.(); // Notify parent component to update counts
  };

  const handleUpdateTopicStatus = async (topicId: string, status: 'active' | 'paused') => {
    try {
      await groupsService.updateTopicStatus(group.id, topicId, status);
      // Refresh topics based on current view
      if (selectedSubgroup) {
        loadSubgroupTopics(selectedSubgroup.id);
      } else {
        loadTopics();
      }
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show topic content if a topic is selected
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

  return (
    <>
      {/* Main Content */}
      <div className="space-y-6">
        {/* Subgroup View */}
        {selectedSubgroup ? (
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
              {(group.memberRole === 'admin' || group.memberRole === 'moderator' || group.canCreateTopics) && (
                <button
                  onClick={() => setShowCreateTopic(true)}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subgroup Topics in this subgroup</h3>
                  <p className="text-gray-500">Subgroup Topics will appear here when created</p>
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
        ) : (
          /* Main Group View */
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
                    <h3 className="text-lg font-semibold text-gray-900">Subgroup Topics</h3>
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
                            <ChatBubbleLeftRightIcon className="w-3 h-3" />
                            <span>{subgroupTopicCounts.get(subgroup.id) || 0} topics</span>
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
                            {(() => {
                              const topics = subgroupTopics.get(subgroup.id) || [];
                              if (topics.length === 0) {
                                return <div className="text-sm text-gray-400 italic">No topics in this subgroup yet</div>;
                              }
                              return (
                                <div className="space-y-2">
                                  {topics.map((topic) => (
                                    <div
                                      key={topic.id}
                                      onClick={() => handleTopicSelect(topic)}
                                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                          {getTopicIcon(topic)}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <h4 className="font-medium text-gray-900 text-sm">{topic.name}</h4>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTopicStatusColor(topic.status)}`}>
                                              {topic.status}
                                            </span>
                                          </div>
                                          {topic.description && (
                                            <p className="text-gray-600 text-xs mt-1">{topic.description}</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
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
                  {(group.memberRole === 'admin' || group.memberRole === 'moderator' || group.canCreateTopics) && (
                    <button
                      onClick={() => setShowCreateTopic(true)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create First Topic
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals - Rendered outside main content for proper overlay positioning */}
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

      {showCreateTopic && (
        <CreateTopicModal
          groupId={group.id}
          subgroupId={selectedSubgroup ? (selectedSubgroup as SubgroupResponse).id : undefined}
          currentUserId={currentUserId}
          onClose={() => setShowCreateTopic(false)}
          onTopicCreated={handleTopicCreated}
        />
      )}
    </>
  );
};

export default TopicsList;
