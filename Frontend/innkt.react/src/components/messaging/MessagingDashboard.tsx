import React, { useState, useEffect } from 'react';
import { messagingService, Conversation, Message } from '../../services/messaging.service';
import { useMessaging } from '../../contexts/MessagingContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import MessageComposer from './MessageComposer';
import UserSearch from './UserSearch';

const MessagingDashboard: React.FC = () => {
  const { conversations, loadConversations, markAsRead, sendMessage, connectionStatus, isLoading } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);

  // Load conversations is now handled by the context
  console.log('MessagingDashboard - conversations:', conversations);
  console.log('MessagingDashboard - isLoading:', isLoading);
  console.log('MessagingDashboard - connectionStatus:', connectionStatus);

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const response = await messagingService.getMessages({ 
        conversationId,
        limit: 50 
      });
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    
    // Mark as read
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
  };

  // Handle new message
  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    // Conversations are now managed by the context
  };

  // Handle message send
  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file', media?: File) => {
    if (!selectedConversation) return;

    try {
      await sendMessage(selectedConversation.id, content);
      // Messages will be updated via WebSocket or context
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Real-time updates are now handled by the context

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => 
      (p.displayName && p.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] lg:h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
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
        <ConversationList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
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
            <ChatWindow
              messages={messages}
              conversation={selectedConversation}
            />

            {/* Message Composer */}
            <MessageComposer
              onSendMessage={handleSendMessage}
              conversation={selectedConversation}
            />
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
    </div>
  );
};

export default MessagingDashboard;