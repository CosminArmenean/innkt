import React, { useState, useEffect } from 'react';
import { socialService, Post, Group } from '../../services/social.service';
import { groupsService, PollResponse, TopicResponse } from '../../services/groups.service';
import PostCard from '../social/PostCard';
import GroupPostCreation from './GroupPostCreation';
import GroupAnnouncement from './GroupAnnouncement';
import PollDisplay from './PollDisplay';
import { 
  ChatBubbleLeftRightIcon, 
  FireIcon, 
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface GroupDiscussionProps {
  group: Group;
  currentUserId?: string;
  className?: string;
}

const GroupDiscussion: React.FC<GroupDiscussionProps> = ({
  group,
  currentUserId,
  className = ''
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<PollResponse[]>([]);
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'popular' | 'discussions'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadPosts();
    loadPolls();
    loadTopics();
  }, [group.id, activeFilter, selectedTopic]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const response = await groupsService.getGroupPosts(group.id, {
        limit: 20,
        topicId: selectedTopic || undefined
      });
      setPosts(response.posts);
    } catch (error) {
      console.error('Failed to load group posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPolls = async () => {
    try {
      const polls = await groupsService.getGroupPolls(group.id, selectedTopic || undefined);
      setPolls(polls);
    } catch (error) {
      console.error('Failed to load group polls:', error);
    }
  };

  const loadTopics = async () => {
    try {
      const topics = await groupsService.getGroupTopics(group.id);
      setTopics(topics);
    } catch (error) {
      console.error('Failed to load group topics:', error);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePollCreated = (newPoll: PollResponse) => {
    setPolls(prev => [newPoll, ...prev]);
  };

  const handlePollVote = async (pollId: string, optionIndex: number) => {
    try {
      await groupsService.votePoll(pollId, optionIndex);
      // Reload polls to get updated results
      await loadPolls();
    } catch (error) {
      console.error('Failed to vote on poll:', error);
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(post => post.id === updatedPost.id ? updatedPost : post));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const filteredPosts = posts.filter(post => {
    if (searchQuery.trim()) {
      return post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    }
    return true;
  });

  const filteredPolls = polls.filter(poll => {
    if (searchQuery.trim()) {
      return poll.question.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Create a combined feed of posts and polls
  const combinedItems = [
    ...filteredPosts.map(post => ({ type: 'post' as const, data: post, createdAt: post.createdAt })),
    ...filteredPolls.map(poll => ({ type: 'poll' as const, data: poll, createdAt: poll.createdAt }))
  ];

  const sortedItems = [...combinedItems].sort((a, b) => {
    switch (activeFilter) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        if (a.type === 'post' && b.type === 'post') {
          return (b.data.likesCount + b.data.commentsCount + b.data.sharesCount) - (a.data.likesCount + a.data.commentsCount + a.data.sharesCount);
        }
        if (a.type === 'poll' && b.type === 'poll') {
          return b.data.totalVotes - a.data.totalVotes;
        }
        // Mixed types - prioritize posts for popular
        return a.type === 'post' ? -1 : 1;
      case 'discussions':
        if (a.type === 'post' && b.type === 'post') {
          return b.data.commentsCount - a.data.commentsCount;
        }
        if (a.type === 'poll' && b.type === 'poll') {
          return b.data.totalVotes - a.data.totalVotes;
        }
        // Mixed types - prioritize posts for discussions
        return a.type === 'post' ? -1 : 1;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getFilterIcon = (filter: string) => {
    switch (filter) {
      case 'recent':
        return <ClockIcon className="w-4 h-4" />;
      case 'popular':
        return <FireIcon className="w-4 h-4" />;
      case 'discussions':
        return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'recent':
        return 'Recent';
      case 'popular':
        return 'Popular';
      case 'discussions':
        return 'Discussions';
      default:
        return 'All Posts';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Discussion Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Group Discussions</h2>
            <p className="text-gray-600">Share ideas, ask questions, and connect with group members</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Search posts"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Filter posts"
            >
              <FunnelIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts and discussions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Topic Filter */}
        {topics.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Topic</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTopic(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTopic === null
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Topics
              </button>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTopic === topic.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {['all', 'recent', 'popular', 'discussions'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getFilterIcon(filter)}
              <span>{getFilterLabel(filter)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Announcement Creation */}
      <GroupAnnouncement
        groupId={group.id}
        groupName={group.name}
        currentUserId={currentUserId}
        userRole={group.memberRole}
        onAnnouncementCreated={handlePostCreated}
      />

      {/* Post Creation */}
      {group.isMember && (
        <GroupPostCreation
          groupId={group.id}
          groupName={group.name}
          onPostCreated={handlePostCreated}
          onPollCreated={handlePollCreated}
        />
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
            <p className="text-gray-500 mb-4">
              {group.isMember 
                ? "Be the first to start a discussion in this group!"
                : "Join the group to participate in discussions."
              }
            </p>
            {!group.isMember && (
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Join Group
              </button>
            )}
          </div>
        ) : (
          sortedItems.map((item) => {
            if (item.type === 'post') {
              const post = item.data;
              return (
            <PostCard
              key={post.id}
              post={post}
              canSeeRealUsername={group.canSeeRealUsername || false}
              userRole={group.memberRole || 'member'}
              onEcho={() => {
                // Handle echo/like
                const updatedPost = { ...post, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 };
                handlePostUpdate(updatedPost);
              }}
              onShare={() => {
                // Handle share
                const updatedPost = { ...post, isShared: !post.isShared, sharesCount: post.isShared ? post.sharesCount - 1 : post.sharesCount + 1 };
                handlePostUpdate(updatedPost);
              }}
              onEdit={handlePostUpdate}
              onDelete={handlePostDelete}
              onReport={() => {
                alert('Post reported. Thank you for helping keep our community safe.');
              }}
              formatDate={(date) => new Date(date).toLocaleDateString()}
              getPostVisibilityIcon={() => '👥'}
              getPostTypeIcon={(type) => {
                switch (type) {
                  case 'image': return '🖼️';
                  case 'video': return '🎥';
                  case 'link': return '🔗';
                  case 'poll': return '📊';
                  default: return '📝';
                }
              }}
              currentUserId={currentUserId}
            />
              );
            } else {
              return (
                <PollDisplay
                  key={`poll-${item.data.id}`}
                  poll={item.data}
                  onVote={handlePollVote}
                />
              );
            }
          })
        )}
      </div>

      {/* Load More Button */}
      {sortedItems.length > 0 && (
        <div className="text-center">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupDiscussion;
