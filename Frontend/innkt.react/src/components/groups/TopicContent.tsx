import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Group, Post } from '../../services/social.service';
import { groupsService, TopicResponse } from '../../services/groups.service';
import { convertToFullAvatarUrl } from '../../utils/avatarUtils';
import PostCard from '../social/PostCard';
import GroupPostCreation from './GroupPostCreation';
import CompactFilters from './CompactFilters';
import { 
  ArrowLeftIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface TopicContentProps {
  topic: TopicResponse;
  group: Group;
  currentUserId?: string;
  onBack: () => void;
  onPostCreated?: (post: Post) => void;
}

const TopicContent: React.FC<TopicContentProps> = ({
  topic,
  group,
  currentUserId,
  onBack,
  onPostCreated
}) => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'popular' | 'discussions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [topic.id, activeFilter]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const response = await groupsService.getGroupPosts(group.id, {
        limit: 20,
        topicId: topic.id
      });
      
      // Convert GroupPostResponse to Post format
      const convertedPosts = response.posts.map((groupPost: any) => ({
        id: groupPost.id,
        userId: groupPost.userId,
        author: groupPost.author ? {
          id: groupPost.author.id,
          username: groupPost.author.username,
          displayName: groupPost.author.displayName,
          avatarUrl: convertToFullAvatarUrl(groupPost.author.avatarUrl) || undefined,
          isVerified: groupPost.author.isVerified || false,
          isKidAccount: false, // Default to false for now
        } : null,
        // Role posting information (moved to post level)
        postedAsRoleId: groupPost.postedAsRoleId,
        postedAsRoleName: groupPost.postedAsRoleName,
        postedAsRoleAlias: groupPost.postedAsRoleAlias,
        showRealUsername: groupPost.showRealUsername,
        realUsername: groupPost.realUsername,
        content: groupPost.content,
        mediaUrls: groupPost.mediaUrls || [],
        postType: 'text' as const,
        visibility: 'group' as const,
        groupId: group.id,
        location: groupPost.location ? { name: groupPost.location } : undefined,
        hashtags: groupPost.hashtags || [],
        likesCount: groupPost.likesCount || 0,
        commentsCount: groupPost.commentsCount || 0,
        sharesCount: 0,
        createdAt: groupPost.createdAt,
        updatedAt: groupPost.createdAt,
        isPinned: groupPost.isPinned || false,
        isLiked: groupPost.isLikedByCurrentUser || false,
        isShared: false
      }));
      
      setPosts(convertedPosts);
    } catch (error) {
      console.error('Failed to load topic posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = (newPost: any) => {
    // Convert TopicPostResponse to Post format
    const convertedPost: Post = {
      id: newPost.id,
      userId: newPost.userId,
      author: newPost.author ? {
        id: newPost.author.id,
        username: newPost.author.username,
        displayName: newPost.author.displayName,
        avatarUrl: convertToFullAvatarUrl(newPost.author.avatarUrl) || undefined,
        isVerified: newPost.author.isVerified || false,
        isKidAccount: false // Default to false for now
      } : null,
      content: newPost.content,
      mediaUrls: newPost.mediaUrls || [],
      postType: 'text' as const,
      visibility: 'group' as const,
      groupId: group.id,
      location: newPost.location ? { name: newPost.location } : undefined,
      hashtags: newPost.hashtags || [],
      likesCount: newPost.likesCount || 0,
      commentsCount: newPost.commentsCount || 0,
      sharesCount: 0,
      createdAt: newPost.createdAt || new Date().toISOString(),
      updatedAt: newPost.createdAt || new Date().toISOString(),
      isPinned: newPost.isPinned || false,
      isLiked: newPost.isLikedByCurrentUser || false,
      isShared: false
    };
    
    setPosts(prev => {
      // Check if post already exists to avoid duplicates
      const exists = prev.some(p => p.id === convertedPost.id);
      if (exists) {
        console.log('Post already exists, not adding duplicate:', convertedPost.id);
        return prev;
      }
      return [convertedPost, ...prev];
    });
    if (onPostCreated) {
      onPostCreated(convertedPost);
    }
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

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 rounded-lg">
            <TagIcon className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">{topic.name}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <UsersIcon className="w-4 h-4" />
              <span>{posts.length} posts</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {topic.allowMemberPosts && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Members</span>
          )}
          {topic.allowKidPosts && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Kids</span>
          )}
          {topic.allowParentPosts && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Parents</span>
          )}
          {topic.allowRolePosts && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Roles</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="relative">
        <CompactFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={showSearch}
          onToggleSearch={() => setShowSearch(!showSearch)}
        />
      </div>

      {/* Post Creation */}
      {group.isMember && (
        <GroupPostCreation
          groupId={group.id}
          groupName={group.name}
          currentUserId={currentUserId}
          onPostCreated={handlePostCreated}
          selectedTopicId={topic.id}
        />
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500">Be the first to start a discussion in this topic</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <div key={post.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <PostCard 
                post={post} 
                currentUserId={currentUserId}
                canSeeRealUsername={group.canSeeRealUsername || false}
                userRole={group.memberRole || 'member'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicContent;
