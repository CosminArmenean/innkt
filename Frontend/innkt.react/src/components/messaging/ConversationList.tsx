import React from 'react';
import { Conversation } from '../../services/messaging.service';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
  isLoading: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onConversationSelect,
  isLoading
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.name) {
      return conversation.name;
    }
    
    if (conversation.type === 'direct') {
      return conversation.participants[0]?.displayName || 'Unknown User';
    }
    
    return conversation.participants.map(p => p.displayName || 'Unknown User').join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) {
      return conversation.avatar;
    }
    
    if (conversation.type === 'direct') {
      return conversation.participants[0]?.avatar;
    }
    
    return null;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }
    
    const message = conversation.lastMessage;
    const senderName = message.senderProfile?.displayName || 'Unknown User';
    
    switch (message.type) {
      case 'text':
        return `${senderName}: ${message.content}`;
      case 'image':
        return `${senderName}: 📷 Image`;
      case 'file':
        return `${senderName}: 📎 File`;
      case 'system':
        return message.content;
      default:
        return `${senderName}: Message`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-innkt-primary"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
          <p className="mt-1 text-sm text-gray-500">Start a new conversation to begin messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onConversationSelect(conversation)}
          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedConversation?.id === conversation.id ? 'bg-innkt-primary bg-opacity-5 border-l-4 border-l-innkt-primary' : ''
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {getConversationAvatar(conversation) ? (
                <img
                  src={getConversationAvatar(conversation) || ''}
                  alt={getConversationDisplayName(conversation)}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    console.log('Conversation avatar image failed to load:', getConversationAvatar(conversation));
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-innkt-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {getConversationDisplayName(conversation).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium truncate ${
                  conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {getConversationDisplayName(conversation)}
                </h4>
                <div className="flex items-center space-x-2">
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(conversation.lastMessage.timestamp)}
                    </span>
                  )}
                  {conversation.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-innkt-primary rounded-full">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              
              <p className={`text-sm truncate mt-1 ${
                conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}>
                {getLastMessagePreview(conversation)}
              </p>
              
              {/* Online Status for Direct Messages */}
              {conversation.type === 'direct' && conversation.participants[0]?.isOnline && (
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-600">Online</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
