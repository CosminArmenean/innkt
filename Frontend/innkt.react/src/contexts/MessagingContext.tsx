import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { messagingService, Conversation, Message } from '../services/messaging.service';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface MessagingContextType {
  conversations: Conversation[];
  unreadCount: number;
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  currentMessages: Message[];
  currentConversationId: string | null;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createDirectConversation: (userId: string) => Promise<Conversation>;
  socket: Socket | null;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: React.ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations with debounce
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    // Debounce: only load if it's been more than 2 seconds since last load
    const now = Date.now();
    if (now - lastLoadTime < 2000) {
      console.log('Debouncing conversation load request');
      return;
    }

    setLastLoadTime(now);
    setIsLoading(true);
    try {
      const fetchedConversations = await messagingService.getConversations();
      setConversations(fetchedConversations);
      
      // Calculate total unread count
      const totalUnread = fetchedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, lastLoadTime]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await messagingService.markAsRead(conversationId);
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      
      // Update unread count
      setUnreadCount(prev => {
        const conv = conversations.find(c => c.id === conversationId);
        return prev - (conv?.unreadCount || 0);
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [conversations]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setCurrentConversationId(conversationId);
      const response = await messagingService.getMessages({ conversationId, limit: 50 });
      setCurrentMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setCurrentMessages([]);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    try {
      console.log('📤 Sending message:', { conversationId, content });
      await messagingService.sendMessage({
        conversationId,
        content,
        type: 'text'
      });
      console.log('✅ Message sent successfully');
      // Don't reload conversations - real-time updates will handle it
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }, []);

  // Create direct conversation
  const createDirectConversation = useCallback(async (userId: string) => {
    try {
      const conversation = await messagingService.createDirectConversation(userId);
      await loadConversations();
      return conversation;
    } catch (error) {
      console.error('Failed to create direct conversation:', error);
      throw error;
    }
  }, [loadConversations]);

  // Initialize WebSocket connection only when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnectionStatus('disconnected');
      }
      return;
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No authentication token found for WebSocket connection, skipping real-time features');
      setConnectionStatus('disconnected');
      // Still load conversations via HTTP API
      loadConversations();
      return;
    }

    setConnectionStatus('connecting');
    
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        token: token
      },
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to messaging service');
      console.log('Socket ID:', newSocket.id);
      setConnectionStatus('connected');
      // Pass the socket to the messaging service
      messagingService.setSocket(newSocket);
      // Load conversations after connecting
      loadConversations();
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from messaging service');
      setConnectionStatus('disconnected');
      // Clear the socket from the messaging service
      messagingService.setSocket(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setConnectionStatus('disconnected');
      
      // If it's an auth error, try to reconnect after a delay
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        console.log('Authentication error, will retry connection...');
        setTimeout(() => {
          if (isAuthenticated && user) {
            loadConversations();
          }
        }, 5000);
      }
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    newSocket.on('new_message', (message: Message) => {
      console.log('📨 New message received:', message);
      console.log('Current conversation ID:', currentConversationId);
      console.log('Message conversation ID:', message.conversationId);
      
      // Update conversations locally instead of reloading
      setConversations(prev => prev.map(conv => 
        conv.id === message.conversationId 
          ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
          : conv
      ));
      setUnreadCount(prev => prev + 1);
      
      // Update current messages if this is the active conversation
      if (currentConversationId === message.conversationId) {
        console.log('✅ Adding message to current conversation');
        setCurrentMessages(prev => [...prev, message]);
      } else {
        console.log('❌ Message not for current conversation');
      }
    });

    newSocket.on('conversationUpdated', (conversation: Conversation) => {
      console.log('Conversation updated:', conversation);
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id ? conversation : conv
      ));
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const value: MessagingContextType = {
    conversations,
    unreadCount,
    isLoading,
    connectionStatus,
    currentMessages,
    currentConversationId,
    loadConversations,
    loadMessages,
    markAsRead,
    sendMessage,
    createDirectConversation,
    socket
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};
