import React, { useEffect, useRef } from 'react';
import { Message, Conversation } from '../../services/messaging.service';

// Helper function to get current user ID from token
const getCurrentUserId = (): string | null => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
  } catch (error) {
    console.error('Failed to get current user ID:', error);
    return null;
  }
};

interface ChatWindowProps {
  messages: Message[];
  conversation: Conversation;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, conversation }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'delivered':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'read':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={message.media?.url}
              alt="Shared image"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.media?.url, '_blank')}
            />
            {message.content && (
              <div className="whitespace-pre-wrap break-words text-sm">
                {message.content}
              </div>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.media?.name || 'File'}
              </p>
              <p className="text-sm text-gray-500">
                {message.media?.size ? `${(message.media.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
              </p>
            </div>
            <button
              onClick={() => window.open(message.media?.url, '_blank')}
              className="flex-shrink-0 px-3 py-1 bg-innkt-primary text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              Download
            </button>
          </div>
        );
      case 'system':
        return (
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
              {message.content}
            </span>
          </div>
        );
      default:
        return <div className="text-gray-500 italic">Unsupported message type</div>;
    }
  };

  const renderReactions = (message: Message) => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionGroups = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, typeof message.reactions>);

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(reactionGroups).map(([emoji, reactions], index) => (
          <button
            key={`${emoji}-${index}`}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
          >
            <span>{emoji}</span>
            <span className="text-xs text-gray-600">{reactions.length}</span>
          </button>
        ))}
      </div>
    );
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start the conversation by sending a message.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {Object.entries(groupedMessages).map(([date, dateMessages], dateIndex) => (
        <div key={`date-${date}-${dateIndex}`}>
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="flex items-center space-x-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {formatMessageDate(dateMessages[0].timestamp)}
              </span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
          </div>

          {/* Messages for this date */}
          {dateMessages.map((message, index) => {
            const currentUserId = getCurrentUserId();
            const isCurrentUser = message.senderId === currentUserId;
            const isConsecutive = index > 0 && 
              dateMessages[index - 1].senderId === message.senderId &&
              new Date(message.timestamp).getTime() - new Date(dateMessages[index - 1].timestamp).getTime() < 5 * 60 * 1000; // 5 minutes

            return (
              <div
                key={message.id || `message-${index}-${message.timestamp}`}
                className={`flex ${message.type === 'system' ? 'justify-center' : (isCurrentUser ? 'justify-end' : 'justify-start')} ${
                  isConsecutive ? 'mt-1' : 'mt-4'
                }`}
              >
                {message.type !== 'system' && (
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    {!isConsecutive && (
                      <div className="flex-shrink-0">
                        {message.senderProfile?.avatar ? (
                          <img
                            src={message.senderProfile.avatar}
                            onError={(e) => {
                              console.log('Chat avatar image failed to load:', message.senderProfile?.avatar);
                              e.currentTarget.style.display = 'none';
                            }}
                            alt={message.senderProfile.displayName || 'User'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCurrentUser ? 'bg-innkt-primary' : 'bg-gray-500'
                          }`}>
                            <span className="text-white text-sm font-semibold">
                              {(message.senderProfile?.displayName || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    <div className={`flex flex-col ${isConsecutive ? (isCurrentUser ? 'mr-10' : 'ml-10') : ''}`}>
                      {!isConsecutive && !isCurrentUser && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.senderProfile?.displayName || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`p-3 rounded-lg ${
                        (message.type as string) === 'system' 
                          ? 'bg-gray-100' 
                          : isCurrentUser 
                            ? 'bg-innkt-primary text-white' 
                            : 'bg-white border border-gray-200 shadow-sm'
                      }`}>
                        {renderMessageContent(message)}
                        {renderReactions(message)}
                      </div>
                      
                      {isConsecutive && (
                        <div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {isCurrentUser && getMessageStatusIcon(message.status)}
                        </div>
                      )}
                      
                      {!isConsecutive && isCurrentUser && (
                        <div className="flex items-center justify-end mt-1">
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {getMessageStatusIcon(message.status)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {message.type === 'system' && (
                  <div className="w-full">
                    {renderMessageContent(message)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
