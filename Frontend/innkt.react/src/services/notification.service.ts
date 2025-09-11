import { io, Socket } from 'socket.io-client';
import { environment } from '../config/environment';

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'message' | 'group_invite' | 'post_mention' | 'system';
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  read: boolean;
  userId: string;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  byType: {
    follow: number;
    like: number;
    comment: number;
    message: number;
    group_invite: number;
    post_mention: number;
    system: number;
  };
}

export interface NotificationSettings {
  newFollowers: boolean;
  newPosts: boolean;
  mentions: boolean;
  directMessages: boolean;
  groupUpdates: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

export interface NotificationListResponse {
  notifications: Notification[];
  totalCount: number;
  hasMore: boolean;
}

class NotificationService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.socket = io(environment.api.messaging, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on('connect', () => {
        console.log('🔔 Connected to notification service');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔔 Disconnected from notification service:', reason);
        this.isConnected = false;
        this.emit('disconnected', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔔 Connection error:', error);
        this.reconnectAttempts++;
        this.emit('error', error);
      });

      // Listen for notifications
      this.socket.on('notification', (notification: Notification) => {
        console.log('🔔 Received notification:', notification);
        this.emit('notification', notification);
      });

      // Listen for notification counts
      this.socket.on('notification_counts', (counts: NotificationCounts) => {
        console.log('🔔 Received notification counts:', counts);
        this.emit('counts', counts);
      });

      // Listen for real-time updates
      this.socket.on('follow_count', (count: number) => {
        this.emit('follow_count', count);
      });

      this.socket.on('message_count', (count: number) => {
        this.emit('message_count', count);
      });

      this.socket.on('group_invite_count', (count: number) => {
        this.emit('group_invite_count', count);
      });

    } catch (error) {
      console.error('Failed to connect to notification service:', error);
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Authentication
  authenticate(userId: string, token: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('authenticate', { userId, token });
    }
  }

  // Subscribe to user notifications
  subscribeToUser(userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_user', userId);
    }
  }

  // Unsubscribe from user notifications
  unsubscribeFromUser(userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_user', userId);
    }
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', notificationId);
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_all_read');
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get notifications (for compatibility with existing components)
  async getNotifications(page: number = 0, limit: number = 50): Promise<NotificationListResponse> {
    // For now, return empty notifications
    // In a real implementation, this would fetch from the API
    return {
      notifications: [],
      totalCount: 0,
      hasMore: false
    };
  }

  // Get unread count (for compatibility with existing components)
  async getUnreadCount(): Promise<number> {
    // For now, return 0
    // In a real implementation, this would fetch from the API
    return 0;
  }

  // Get notification settings (for compatibility with existing components)
  async getNotificationSettings(): Promise<NotificationSettings> {
    // Return default settings
    return {
      newFollowers: true,
      newPosts: true,
      mentions: true,
      directMessages: true,
      groupUpdates: true,
      desktopNotifications: true,
      soundEnabled: true,
      pushNotifications: true,
      emailNotifications: true
    };
  }

  // Update notification settings (for compatibility with existing components)
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    // For now, just log the update
    console.log('Updating notification settings:', settings);
  }

  // Delete notification (for compatibility with existing components)
  async deleteNotification(notificationId: string): Promise<void> {
    // For now, just log the deletion
    console.log('Deleting notification:', notificationId);
  }

  // Cleanup
  destroy() {
    this.disconnect();
    this.listeners.clear();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;