import React from 'react';
import { Post } from '../../services/social.service';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onEcho?: () => void;
  onEdit?: (updatedPost: Post) => void;
  onDelete?: (postId: string) => void;
  onReport?: () => void;
  formatDate?: (date: any) => string;
  getPostVisibilityIcon?: () => string;
  getPostTypeIcon?: (type: any) => string;
  currentUserId?: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-gray-600 font-semibold">
            {post.authorId?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">
              {post.authorId || 'Unknown User'}
            </h3>
            <span className="text-gray-500 text-sm">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-800 mt-2">{post.content}</p>
          
          {post.media && post.media.length > 0 && (
            <div className="mt-3">
              {post.media.map((media, index) => (
                <img
                  key={index}
                  src={media.url}
                  alt="Post media"
                  className="max-w-full h-auto rounded-lg"
                />
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-4 mt-3">
            <button
              onClick={() => onLike?.(post.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
            >
              <span>❤️</span>
              <span>{post.likesCount || 0}</span>
            </button>
            <button
              onClick={() => onComment?.(post.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
            >
              <span>💬</span>
              <span>{post.commentsCount || 0}</span>
            </button>
            <button
              onClick={() => onShare?.(post.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-green-500"
            >
              <span>🔄</span>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
