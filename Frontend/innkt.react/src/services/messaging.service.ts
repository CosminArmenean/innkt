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
  username: string;
  displayName: string;
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

  // Conversation Management
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await this.get('/api/conversations');
      return (response as any).conversations || [];
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
      await this.put(`/api/messaging/conversations/${conversationId}/settings`, settings);
    } catch (error) {
      console.error('Failed to update conversation settings:', error);
      throw error;
    }
  }

  async addParticipant(conversationId: string, userId: string): Promise<void> {
    try {
      await this.post(`/api/messaging/conversations/${conversationId}/participants`, { userId });
    } catch (error) {
      console.error('Failed to add participant:', error);
      throw error;
    }
  }

  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    try {
      await this.delete(`/api/messaging/conversations/${conversationId}/participants/${userId}`);
    } catch (error) {
      console.error('Failed to remove participant:', error);
      throw error;
    }
  }

  // Message Management
  async getMessages(filters: MessageFilters): Promise<{ messages: Message[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get('/api/messaging/messages', { params: filters });
      return (response as any).data;
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
        this.connect();
      }

      // For now, send via Socket.IO (in production, you might want to handle file uploads differently)
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        this.socket.emit('send_message', {
          conversationId: data.conversationId,
          content: data.content,
          type: data.type,
          replyTo: data.replyTo,
          isEncrypted: data.isEncrypted
        }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.message);
          }
        });
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.delete(`/api/messaging/messages/${messageId}`);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    try {
      const response = await this.put(`/api/messaging/messages/${messageId}`, { content });
      return (response as any).message;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }

  async markAsRead(conversationId: string, messageId?: string): Promise<void> {
    try {
      const endpoint = messageId 
        ? `/api/messaging/conversations/${conversationId}/messages/${messageId}/read`
        : `/api/messaging/conversations/${conversationId}/read`;
      await this.put(endpoint, {});
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  // Message Reactions
  async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      await this.post(`/api/messaging/messages/${messageId}/reactions`, { emoji });
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  async removeReaction(messageId: string, reactionId: string): Promise<void> {
    try {
      await this.delete(`/api/messaging/messages/${messageId}/reactions/${reactionId}`);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  // Real-time Messaging
  connect(): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No auth token available for messaging');
      return;
    }

    const messagingUrl = process.env.REACT_APP_MESSAGING_URL || 'http://localhost:5003';
    
    this.socket = io(messagingUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to messaging service');
      this.isConnected = true;
      this.connectionHandlers.forEach(handler => handler('connected'));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from messaging service');
      this.isConnected = false;
      this.connectionHandlers.forEach(handler => handler('disconnected'));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.connectionHandlers.forEach(handler => handler('disconnected'));
    });

    this.socket.on('new_message', (message: Message) => {
      const handler = this.messageHandlers.get(message.conversationId);
      if (handler) {
        handler(message);
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

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
      this.connect();
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
      const response = await this.get('/api/messaging/messages/search', { 
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
      const response = await this.get('/api/messaging/users/stats');
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

      const response = await this.upload('/api/messaging/files/upload', formData);
      return (response as any).file;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  // Encryption
  async encryptMessage(content: string, conversationId: string): Promise<string> {
    try {
      const response = await this.post('/api/messaging/messages/encrypt', { content, conversationId });
      return (response as any).encryptedContent;
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw error;
    }
  }

  async decryptMessage(encryptedContent: string, conversationId: string): Promise<string> {
    try {
      const response = await this.post('/api/messaging/messages/decrypt', { encryptedContent, conversationId });
      return (response as any).content;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw error;
    }
  }
}

export const messagingService = new MessagingService();
