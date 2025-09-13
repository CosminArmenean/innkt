import { BaseApiService, messagingApi } from './api.service';
import { io, Socket } from 'socket.io-client';

// Message Interfaces
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderProfile: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  media?: {
    url: string;
    type: string;
    size: number;
    name: string;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isEncrypted: boolean;
  replyTo?: string;
  reactions: MessageReaction[];
  metadata?: any;
}

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: ConversationSettings;
}

export interface ConversationParticipant {
  userId: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  lastSeen: string;
  isOnline: boolean;
}

export interface ConversationSettings {
  allowFileSharing: boolean;
  allowReactions: boolean;
  allowReplies: boolean;
  messageRetention: number; // days
  encryptionEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface MessageFilters {
  conversationId?: string;
  senderId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MessageStats {
  totalMessages: number;
  messagesToday: number;
  activeConversations: number;
  unreadMessages: number;
  byType: Record<string, number>;
  byConversation: Array<{ conversationId: string; count: number }>;
}

class MessagingService extends BaseApiService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, (message: Message) => void> = new Map();
  private connectionHandlers: Map<string, (status: 'connected' | 'disconnected') => void> = new Map();
  private isConnected: boolean = false;

  constructor() {
    super(messagingApi);
  }

  // Method to set the socket from MessagingContext
  setSocket(socket: Socket | null) {
    this.socket = socket;
    this.isConnected = socket?.connected || false;
  }

  private getCurrentUserId(): string | null {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  // Conversation Management
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await this.get('/api/conversations');
      const conversations = (response as any).conversations || [];
      
      // Transform the data to match the expected interface
      return conversations.map((conv: any) => {
        const participants = conv.participants?.map((p: any) => ({
          userId: p.userId,
          username: p.username || p.userId, // Fallback to userId if no username
          displayName: p.displayName || p.userId, // Fallback to userId if no displayName
          avatar: p.avatar,
          role: p.role || 'member'
        })) || [];

        // Generate conversation name based on participants
        let conversationName = conv.name;
        if (!conversationName && conv.type === 'direct' && participants.length > 0) {
          // For direct messages, use the other participant's name
          const currentUserId = this.getCurrentUserId();
          const otherParticipants = participants.filter((p: any) => {
            // Handle both string userId and object with userId property
            const participantId = typeof p === 'string' ? p : (p.userId || p);
            return participantId !== currentUserId;
          });
          
          if (otherParticipants.length > 0) {
            const otherParticipant = otherParticipants[0];
            if (typeof otherParticipant === 'string') {
              // If it's just a string ID, use it as display name
              conversationName = `User ${otherParticipant.substring(0, 8)}...`;
            } else {
              conversationName = otherParticipant.displayName || otherParticipant.username || `User ${otherParticipant.userId?.substring(0, 8)}...`;
            }
          } else {
            conversationName = 'Direct Message';
          }
        } else if (!conversationName) {
          conversationName = 'Group Chat';
        }

        return {
          id: conv._id || conv.id,
          type: conv.type,
          name: conversationName,
          avatar: conv.avatar,
          participants,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount || 0,
          isActive: conv.isActive !== false,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          settings: conv.settings || {
            allowFileSharing: true,
            allowReactions: true,
            allowReplies: true,
            messageRetention: 365,
            encryptionEnabled: false,
            notificationsEnabled: true
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await this.get(`/api/conversations/${conversationId}`);
      return (response as any).conversation;
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      throw error;
    }
  }

  async createDirectConversation(userId: string): Promise<Conversation> {
    try {
      const response = await this.post('/api/conversations/direct', { userId });
      return (response as any).conversation;
    } catch (error) {
      console.error('Failed to create direct conversation:', error);
      throw error;
    }
  }

  async createGroupConversation(data: {
    name: string;
    description?: string;
    participants: string[];
    settings?: Partial<ConversationSettings>;
  }): Promise<Conversation> {
    try {
      const response = await this.post('/api/conversations/group', data);
      return (response as any).conversation;
    } catch (error) {
      console.error('Failed to create group conversation:', error);
      throw error;
    }
  }

  async updateConversationSettings(
    conversationId: string,
    settings: Partial<ConversationSettings>
  ): Promise<void> {
    try {
      await this.put(`/api/conversations/${conversationId}/settings`, settings);
    } catch (error) {
      console.error('Failed to update conversation settings:', error);
      throw error;
    }
  }

  async addParticipant(conversationId: string, userId: string): Promise<void> {
    try {
      await this.post(`/api/conversations/${conversationId}/participants`, { userId });
    } catch (error) {
      console.error('Failed to add participant:', error);
      throw error;
    }
  }

  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    try {
      await this.delete(`/api/conversations/${conversationId}/participants/${userId}`);
    } catch (error) {
      console.error('Failed to remove participant:', error);
      throw error;
    }
  }

  // Message Management
  async getMessages(filters: MessageFilters): Promise<{ messages: Message[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get('/api/messages', filters);
      return response as { messages: Message[]; totalCount: number; hasMore: boolean };
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return { messages: [], totalCount: 0, hasMore: false };
    }
  }

  async sendMessage(data: {
    conversationId: string;
    content: string;
    type: 'text' | 'image' | 'file';
    media?: File;
    replyTo?: string;
    isEncrypted?: boolean;
  }): Promise<Message> {
    try {
      if (!this.socket) {
        throw new Error('Socket not connected. Please ensure you are logged in.');
      }

      // For now, send via Socket.IO (in production, you might want to handle file uploads differently)
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        // Set up one-time listener for message_sent event
        const handleMessageSent = (response: any) => {
          this.socket!.off('message_sent', handleMessageSent);
          this.socket!.off('error', handleError);
          if (response && response.message) {
            resolve(response.message);
          } else {
            reject(new Error('Invalid response from server'));
          }
        };

        // Set up one-time listener for error event
        const handleError = (error: any) => {
          this.socket!.off('message_sent', handleMessageSent);
          this.socket!.off('error', handleError);
          reject(new Error(error.message || 'Failed to send message'));
        };

        this.socket!.on('message_sent', handleMessageSent);
        this.socket!.on('error', handleError);

        // Send the message
        const messageData = {
          conversationId: data.conversationId,
          content: data.content,
          type: data.type,
          replyTo: data.replyTo,
          isEncrypted: data.isEncrypted
        };
        
        console.log('📤 Sending message via socket:', messageData);
        this.socket!.emit('send_message', messageData);

        // Set timeout to clean up listeners
        setTimeout(() => {
          if (this.socket) {
            this.socket.off('message_sent', handleMessageSent);
            this.socket.off('error', handleError);
          }
          reject(new Error('Message send timeout'));
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.delete(`/api/messages/${messageId}`);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    try {
      const response = await this.put(`/api/messages/${messageId}`, { content });
      return (response as any).message;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }

  async markAsRead(conversationId: string, messageId?: string): Promise<void> {
    try {
      const endpoint = messageId 
        ? `/api/conversations/${conversationId}/messages/${messageId}/read`
        : `/api/conversations/${conversationId}/read`;
      await this.put(endpoint, {});
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  // Message Reactions
  async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      await this.post(`/api/messages/${messageId}/reactions`, { emoji });
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  async removeReaction(messageId: string, reactionId: string): Promise<void> {
    try {
      await this.delete(`/api/messages/${messageId}/reactions/${reactionId}`);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  // Real-time Messaging - Socket is now managed by MessagingContext

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  ): void {
    if (!this.socket) {
      console.warn('Socket not connected. Message subscription will not work.');
      return;
    }

    this.messageHandlers.set(conversationId, onMessage);
    
    // Join conversation room
    this.socket?.emit('join_conversation', { conversationId });
  }

  unsubscribeFromMessages(conversationId: string): void {
    this.messageHandlers.delete(conversationId);
    this.socket?.emit('leave_conversation', { conversationId });
  }

  // Connection Status
  subscribeToConnectionStatus(
    onStatusChange: (status: 'connected' | 'disconnected') => void
  ): void {
    this.connectionHandlers.set('status', onStatusChange);
    
    // If already connected, immediately notify
    if (this.isConnected) {
      onStatusChange('connected');
    }
  }

  // Message Search
  async searchMessages(query: string, filters?: MessageFilters): Promise<Message[]> {
    try {
      const response = await this.get('/api/messages/search', { 
        params: { ...filters, query } 
      });
      return (response as any).messages || [];
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  }

  // Message Statistics
  async getMessageStats(): Promise<MessageStats> {
    try {
      const response = await this.get('/api/users/stats');
      return (response as any).stats;
    } catch (error) {
      console.error('Failed to fetch message stats:', error);
      return {
        totalMessages: 0,
        messagesToday: 0,
        activeConversations: 0,
        unreadMessages: 0,
        byType: {},
        byConversation: []
      };
    }
  }

  // File Upload
  async uploadFile(file: File, conversationId: string): Promise<{ url: string; fileId: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);

      const response = await this.upload('/api/files/upload', formData);
      return (response as any).file;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  // Encryption
  async encryptMessage(content: string, conversationId: string): Promise<string> {
    try {
      const response = await this.post('/api/messages/encrypt', { content, conversationId });
      return (response as any).encryptedContent;
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw error;
    }
  }

  async decryptMessage(encryptedContent: string, conversationId: string): Promise<string> {
    try {
      const response = await this.post('/api/messages/decrypt', { encryptedContent, conversationId });
      return (response as any).content;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw error;
    }
  }
}

export const messagingService = new MessagingService();
