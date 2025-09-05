import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon, 
  UserPlusIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

interface LinkedAccount {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: string;
  isActive: boolean;
}

interface Post {
  id: string;
  content: string;
  image?: string;
  authorId: string;
  linkedAccountId?: string;
  isLinkedPost: boolean;
  branchType: 'main' | 'linked' | 'shared';
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
}

interface LinkedAccountsPostProps {
  post: Post;
  linkedAccounts: LinkedAccount[];
  currentUserId: string;
}

const LinkedAccountsPost: React.FC<LinkedAccountsPostProps> = ({ 
  post, 
  linkedAccounts, 
  currentUserId 
}) => {
  const [showChatOptions, setShowChatOptions] = useState(false);

  const getAuthorInfo = () => {
    if (post.isLinkedPost && post.linkedAccountId) {
      const linkedAccount = linkedAccounts.find(acc => acc.id === post.linkedAccountId);
      return {
        name: linkedAccount?.name || 'Unknown',
        username: linkedAccount?.username || 'unknown',
        avatar: linkedAccount?.avatar || '/api/placeholder/40/40',
        platform: linkedAccount?.platform || 'unknown'
      };
    }
    
    // Default user info (would come from user context)
    return {
      name: 'Current User',
      username: '@currentuser',
      avatar: '/api/placeholder/40/40',
      platform: 'innkt'
    };
  };

  const getBranchIndicator = () => {
    switch (post.branchType) {
      case 'main':
        return {
          color: 'bg-blue-500',
          text: 'Main Account',
          icon: '👤'
        };
      case 'linked':
        return {
          color: 'bg-green-500',
          text: 'Linked Account',
          icon: '🔗'
        };
      case 'shared':
        return {
          color: 'bg-purple-500',
          text: 'Shared Post',
          icon: '🤝'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Unknown',
          icon: '❓'
        };
    }
  };

  const getAvailableChatOptions = (): Array<{
    type: 'individual' | 'group';
    account?: LinkedAccount | { name: string; username: string; platform: string; avatar?: string };
    accounts?: (LinkedAccount | undefined)[];
    label: string;
  }> => {
    if (post.branchType === 'shared') {
      // Both accounts are involved
      const mainAccount = linkedAccounts.find(acc => acc.platform === 'innkt');
      const linkedAccount = linkedAccounts.find(acc => acc.id === post.linkedAccountId);
      
      return [
        {
          type: 'individual',
          account: mainAccount,
          label: 'Chat with Main Account'
        },
        {
          type: 'individual', 
          account: linkedAccount,
          label: 'Chat with Linked Account'
        },
        {
          type: 'group',
          accounts: [mainAccount, linkedAccount].filter(Boolean),
          label: 'Chat with Both'
        }
      ];
    } else if (post.branchType === 'linked') {
      // Only linked account
      const linkedAccount = linkedAccounts.find(acc => acc.id === post.linkedAccountId);
      return [
        {
          type: 'individual',
          account: linkedAccount,
          label: 'Chat with Linked Account'
        }
      ];
    } else {
      // Main account only
      return [
        {
          type: 'individual',
          account: { name: 'Current User', username: '@currentuser', platform: 'innkt', avatar: '/api/placeholder/32/32' },
          label: 'Chat with Main Account'
        }
      ];
    }
  };

  const authorInfo = getAuthorInfo();
  const branchIndicator = getBranchIndicator();
  const chatOptions = getAvailableChatOptions();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Author Avatar */}
          <div className="relative">
            <img
              src={authorInfo.avatar}
              alt={authorInfo.name}
              className="w-12 h-12 rounded-full border-2 border-gray-200"
            />
            {/* Branch Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${branchIndicator.color} flex items-center justify-center text-white text-xs`}>
              {branchIndicator.icon}
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{authorInfo.name}</h3>
              <span className="text-sm text-gray-500">{authorInfo.username}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full text-white ${branchIndicator.color}`}>
                {branchIndicator.text}
              </span>
              <span className="text-xs text-gray-500">{authorInfo.platform}</span>
            </div>
          </div>
        </div>

        {/* Chat Options Button */}
        <div className="relative">
          <button
            onClick={() => setShowChatOptions(!showChatOptions)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </button>

          {/* Chat Options Dropdown */}
          {showChatOptions && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="p-3 border-b border-gray-100">
                <h4 className="font-medium text-gray-900">Start a Chat</h4>
                <p className="text-sm text-gray-500">Choose who to chat with</p>
              </div>
              
              <div className="p-2">
                {chatOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Handle chat initiation
                      console.log('Starting chat:', option);
                      setShowChatOptions(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    {option.type === 'group' ? (
                      <>
                        <div className="flex -space-x-2">
                          {option.accounts?.map((account: LinkedAccount | undefined, idx: number) => (
                            <img
                              key={idx}
                              src={account?.avatar || '/api/placeholder/32/32'}
                              alt={account?.name}
                              className="w-8 h-8 rounded-full border-2 border-white"
                            />
                          ))}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">
                            {option.accounts?.map((acc: LinkedAccount | undefined) => acc?.name).join(' & ')}
                          </p>
                        </div>
                        <UserPlusIcon className="h-5 w-5 text-gray-400" />
                      </>
                    ) : (
                      <>
                        <img
                          src={(option.account as LinkedAccount)?.avatar || '/api/placeholder/32/32'}
                          alt={option.account?.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.account?.name}</p>
                        </div>
                        <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
        {post.image && (
          <div className="mt-4">
            <img
              src={post.image}
              alt="Post content"
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
        <div className="flex items-center space-x-4">
          <span>{post.likes} likes</span>
          <span>{post.comments} comments</span>
          <span>{post.shares} shares</span>
        </div>
        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Branch Connection Line (Visual Indicator) */}
      {post.branchType === 'shared' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white text-xs">🤝</span>
            </div>
            <span>This post involves both accounts</span>
            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white text-xs">🤝</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedAccountsPost;
