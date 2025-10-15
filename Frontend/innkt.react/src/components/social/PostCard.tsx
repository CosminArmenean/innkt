import React from 'react';
import { useTranslation } from 'react-i18next';
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
  // User permissions for real username visibility
  canSeeRealUsername?: boolean;
  userRole?: string; // 'admin', 'moderator', 'member'
  currentUserId?: string;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  canSeeRealUsername = false, 
  userRole = 'member' 
}) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start space-x-3">
        {post.postedAsRoleName ? (
          // Role-based avatar
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {(post.postedAsRoleAlias || post.postedAsRoleName).charAt(0).toUpperCase()}
            </span>
          </div>
        ) : post.author?.avatarUrl ? (
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName || post.author.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-semibold">
              {(post.author?.displayName || post.author?.username || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {/* Show role name if posting as role, otherwise show user name */}
            {post.postedAsRoleName ? (
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">
                  {post.postedAsRoleAlias || post.postedAsRoleName}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {post.postedAsRoleName}
                </span>
                {/* Show real username if: 
                    1. The role has showRealUsername enabled, OR
                    2. The current user has permission to see real usernames (admin/moderator/canSeeRealUsername) */}
                {((post.showRealUsername && (post.realUsername || post.author?.username)) || 
                  (canSeeRealUsername && (post.realUsername || post.author?.username))) && (
                  <span className="text-gray-500 text-sm">
                    @{post.realUsername || post.author?.username}
                  </span>
                )}
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900">
                  {post.author?.displayName || post.author?.username || t('social.unknownUser')}
                </h3>
                {post.author?.username && (
                  <span className="text-gray-500 text-sm">
                    @{post.author.username}
                  </span>
                )}
              </>
            )}
            <span className="text-gray-500 text-sm">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-800 mt-2">{post.content}</p>
          
          {/* Poll Display */}
          {post.postType === 'poll' && (
            <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
              <div className="text-sm text-gray-700 mb-2">
                🐛 Debug: PostType = "{post.postType}", PollOptions = {JSON.stringify(post.pollOptions)}
              </div>
              
              {post.pollOptions && post.pollOptions.length > 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      📊 Poll
                    </h4>
                    {post.pollExpiresAt && (
                      <span className="text-sm text-gray-500 flex items-center">
                        ⏰ {new Date(post.pollExpiresAt) > new Date() 
                          ? `Expires ${new Date(post.pollExpiresAt).toLocaleDateString()}`
                          : 'Expired'
                        }
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {post.pollOptions.map((option, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-card border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => {
                          // TODO: Implement voting logic
                          console.log(`Voted for option: ${option}`);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-800">{option}</span>
                          <span className="text-sm text-gray-500">0%</span>
                        </div>
                        <div className="mt-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '0%'}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {post.pollDuration && (
                    <div className="mt-3 text-sm text-gray-500">
                      Duration: {post.pollDuration} hours
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-red-100 text-red-700 rounded">
                  ❌ Poll data missing or empty
                </div>
              )}
            </div>
          )}
          
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
