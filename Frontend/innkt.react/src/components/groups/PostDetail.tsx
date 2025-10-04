import React, { useState, useEffect } from 'react';
import { Post } from '../../services/social.service';
import { groupsService, TopicResponse } from '../../services/groups.service';
import PostCard from '../social/PostCard';
import GroupPostCreation from './GroupPostCreation';
import { 
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface PostDetailProps {
  post: Post;
  groupId: string;
  currentUserId?: string;
  onBack: () => void;
  onPostCreated?: (post: Post) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({
  post,
  groupId,
  currentUserId,
  onBack,
  onPostCreated
}) => {
  const [topic, setTopic] = useState<TopicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ((post as any).topicId) {
      loadTopic();
    } else {
      setIsLoading(false);
    }
  }, [(post as any).topicId]);

  const loadTopic = async () => {
    try {
      const topics = await groupsService.getGroupTopics(groupId);
      const foundTopic = topics.find(t => t.id === (post as any).topicId);
      setTopic(foundTopic || null);
    } catch (error) {
      console.error('Failed to load topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3">
          {topic && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 rounded-lg">
              <TagIcon className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{topic.name}</span>
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Post Discussion</h2>
            <p className="text-sm text-gray-500">Continue the conversation</p>
          </div>
        </div>
      </div>

      {/* Original Post */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <PostCard post={post} currentUserId={currentUserId} />
      </div>

      {/* Post Creation */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Reply to this post</h3>
            <p className="text-sm text-gray-500">Share your thoughts and continue the discussion</p>
          </div>
        </div>
        <GroupPostCreation
          groupId={groupId}
          groupName={(post as any).group?.name || 'Group'}
          currentUserId={currentUserId}
          onPostCreated={onPostCreated}
          selectedTopicId={(post as any).topicId}
        />
      </div>
    </div>
  );
};

export default PostDetail;
