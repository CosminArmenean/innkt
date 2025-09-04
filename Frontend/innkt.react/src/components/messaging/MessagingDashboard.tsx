import React, { useState, useEffect } from 'react';
import { messagingService, Conversation, Message } from '../../services/messaging.service';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import MessageComposer from './MessageComposer';

const MessagingDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);

  // Load conversations
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const fetchedConversations = await messagingService.getConversations();
      setConversations(fetchedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      messagingService.markAsRead(conversation.id);
    }
  };

  // Handle new message
  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // Update conversation list
    setConversations(prev => 
      prev.map(conv => 
        conv.id === message.senderId 
          ? { ...conv, lastMessage: message, unreadCount: conv.id === selectedConversation?.id ? 0 : conv.unreadCount + 1 }
          : conv
      )
    );
  };

  // Handle message send
  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file', media?: File) => {
    if (!selectedConversation) return;

    try {
      const message = await messagingService.sendMessage({
        conversationId: selectedConversation.id,
        content,
        type,
        media
      });
      
      handleNewMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    loadConversations();
    
    // Connect to messaging service
    messagingService.connect();
    
    // Subscribe to connection status
    messagingService.subscribeToConnectionStatus(setConnectionStatus);
    
    return () => {
      // Cleanup subscriptions
      messagingService.disconnect();
    };
  }, []);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      messagingService.subscribeToMessages(
        selectedConversation.id,
        handleNewMessage,
        (error) => console.error('Message stream error:', error)
      );
      
      return () => {
        messagingService.unsubscribeFromMessages(selectedConversation.id);
      };
    }
  }, [selectedConversation]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => 
      p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex h-screen bg-gray-50">
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
                       selectedConversation.participants.map(p => p.displayName).join(', ')}
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

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onConversationCreated={(conversation) => {
            setConversations(prev => [conversation, ...prev]);
            setSelectedConversation(conversation);
            setShowNewConversation(false);
          }}
        />
      )}
    </div>
  );
};

// New Conversation Modal Component
const NewConversationModal: React.FC<{
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}> = ({ onClose, onConversationCreated }) => {
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateConversation = async () => {
    if (conversationType === 'direct' && selectedUsers.length !== 1) {
      alert('Please select exactly one user for direct conversation');
      return;
    }
    
    if (conversationType === 'group' && (!groupName.trim() || selectedUsers.length < 2)) {
      alert('Please provide a group name and select at least 2 users');
      return;
    }

    setIsLoading(true);
    try {
      let conversation: Conversation;
      
      if (conversationType === 'direct') {
        conversation = await messagingService.createDirectConversation(selectedUsers[0]);
      } else {
        conversation = await messagingService.createGroupConversation({
          name: groupName,
          participants: selectedUsers
        });
      }
      
      onConversationCreated(conversation);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to create conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">New Conversation</h3>
        
        {/* Conversation Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="direct"
                checked={conversationType === 'direct'}
                onChange={(e) => setConversationType(e.target.value as 'direct' | 'group')}
                className="mr-2"
              />
              Direct Message
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="group"
                checked={conversationType === 'group'}
                onChange={(e) => setConversationType(e.target.value as 'direct' | 'group')}
                className="mr-2"
              />
              Group Chat
            </label>
          </div>
        </div>

        {/* Group Name */}
        {conversationType === 'group' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-innkt-primary focus:border-transparent"
            />
          </div>
        )}

        {/* User Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select {conversationType === 'direct' ? 'User' : 'Users'}
          </label>
          <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-sm text-gray-500">User selection would be implemented here</p>
            <p className="text-xs text-gray-400 mt-1">This would connect to your user management system</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={isLoading}
            className="px-4 py-2 bg-innkt-primary text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingDashboard;
