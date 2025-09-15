import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { messagingService, Conversation, Message } from '../../services/messaging.service';
import { useMessaging } from '../../contexts/MessagingContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import MessageComposer from './MessageComposer';
import UserSearch from './UserSearch';
import PageLayout from '../layout/PageLayout';
import ScrollableContent from '../layout/ScrollableContent';

const MessagingDashboard: React.FC = () => {
  const location = useLocation();
  const { 
    conversations, 
    loadConversations, 
    loadMessages,
    markAsRead, 
    sendMessage, 
    connectionStatus, 
    isLoading,
    currentMessages,
    currentConversationId
  } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);

  // Load conversations is now handled by the context
  console.log('MessagingDashboard - conversations:', conversations);
  console.log('MessagingDashboard - isLoading:', isLoading);
  console.log('MessagingDashboard - connectionStatus:', connectionStatus);

  // Handle selected conversation from navigation
  useEffect(() => {
    const selectedConversationId = location.state?.selectedConversationId;
    if (selectedConversationId && conversations.length > 0) {
      const conversation = conversations.find(conv => conv.id === selectedConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
        if (conversation.unreadCount > 0) {
          markAsRead(conversation.id);
        }
      }
    }
  }, [location.state, conversations, loadMessages, markAsRead]);

  // Handle conversation selection
  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
    
    // Mark as read
    if (conversation.unreadCount > 0) {
      await markAsRead(conversation.id);
    }
  };

  // Messages are now managed by the context

  // Handle message send
  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file', media?: File) => {
    if (!selectedConversation) return;

    try {
      await sendMessage(selectedConversation.id, content);
      // Real-time updates are handled by the context
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Real-time updates are now handled by the context

  // Load messages when conversation is selected - handled by handleConversationSelect

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => 
      (p.displayName && p.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const leftSidebar = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-500 capitalize">{connectionStatus}</span>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-innkt-primary focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* New Conversation Button */}
        <button
          onClick={() => setShowNewConversation(true)}
          className="w-full mt-3 px-4 py-2 bg-innkt-primary text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <ConversationList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          isLoading={isLoading}
        />
      </div>
    </div>
  );

  const centerContent = (
    <div className="flex flex-col h-full">
      {selectedConversation ? (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedConversation.avatar ? (
                  <img
                    src={selectedConversation.avatar}
                    alt={selectedConversation.name || 'Conversation'}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-innkt-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {selectedConversation.name?.charAt(0) || 
                       selectedConversation.participants[0]?.displayName?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation.name || 
                     selectedConversation.participants.map(p => p.displayName || 'Unknown User').join(', ')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.participants.length} participant{selectedConversation.participants.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 3h5l-5-5v5z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <ChatWindow
              messages={currentMessages}
              conversation={selectedConversation}
            />
          </div>

          {/* Message Composer */}
          <div className="flex-shrink-0">
            <MessageComposer
              onSendMessage={handleSendMessage}
              conversation={selectedConversation}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
            <p className="mt-1 text-sm text-gray-500">Choose a conversation from the sidebar to start messaging.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageLayout
        leftSidebar={leftSidebar}
        centerContent={centerContent}
        layoutType="wide-right"
      />

      {/* User Search Modal */}
      {showNewConversation && (
        <UserSearch
          onClose={() => setShowNewConversation(false)}
          onUserSelect={(conversationId, displayName) => {
            // Find the conversation in the list or create a new one
            const conversation = conversations.find(c => c.id === conversationId);
            if (conversation) {
              setSelectedConversation(conversation);
            } else {
              // If conversation doesn't exist in list, reload conversations
              loadConversations();
            }
            setShowNewConversation(false);
          }}
        />
      )}
    </>
  );
};

export default MessagingDashboard;