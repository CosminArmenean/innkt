import React, { useState, useEffect } from 'react';
import { socialService, Post, Group } from '../../services/social.service';
import PostCard from '../social/PostCard';
import GroupPostCreation from './GroupPostCreation';
import GroupAnnouncement from './GroupAnnouncement';
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'popular' | 'discussions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [group.id, activeFilter]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const response = await socialService.getPosts({
        groupId: group.id,
        limit: 20
      });
      setPosts(response.posts);
    } catch (error) {
      console.error('Failed to load group posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
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

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (activeFilter) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return (b.likesCount + b.commentsCount + b.sharesCount) - (a.likesCount + a.commentsCount + a.sharesCount);
      case 'discussions':
        return b.commentsCount - a.commentsCount;
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
        />
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : sortedPosts.length === 0 ? (
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
          sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
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
          ))
        )}
      </div>

      {/* Load More Button */}
      {sortedPosts.length > 0 && (
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
