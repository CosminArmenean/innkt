import { BaseApiService } from './base-api.service';
import { apiConfig } from './api.config';

// Notification Interfaces
export interface Notification {
  id: string;
  type: 'message' | 'mention' | 'group_invitation' | 'follow' | 'like' | 'comment' | 'post' | 'system';
  userId: string;
  title: string;
  body: string;
  data?: {
    conversationId?: string;
    messageId?: string;
    senderId?: string;
    senderName?: string;
    groupId?: string;
    groupName?: string;
    inviterId?: string;
    inviterName?: string;
    postId?: string;
    commentId?: string;
    [key: string]: any;
  };
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

export interface NotificationSettings {
  newFollowers: boolean;
  newPosts: boolean;
  mentions: boolean;
  directMessages: boolean;
  groupUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    message: number;
    mention: number;
    group_invitation: number;
    follow: number;
    like: number;
    comment: number;
    post: number;
    system: number;
  };
}

class NotificationService extends BaseApiService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private notificationHandlers: ((notification: Notification) => void)[] = [];
  private isConnected = false;

  constructor() {
    super(apiConfig.messagingApi);
  }

  // WebSocket Connection
  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${apiConfig.messagingApi.wsUrl}/notifications?userId=${userId}&token=${token}`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('Notification WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const notification: Notification = JSON.parse(event.data);
            this.handleNotification(notification);
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('Notification WebSocket disconnected');
          this.isConnected = false;
          this.attemptReconnect(userId, token);
        };

        this.socket.onerror = (error) => {
          console.error('Notification WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(userId: string, token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect notification WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(userId, token).catch(() => {
          // Reconnection failed, will try again
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Notification Handlers
  addNotificationHandler(handler: (notification: Notification) => void) {
    this.notificationHandlers.push(handler);
  }

  removeNotificationHandler(handler: (notification: Notification) => void) {
    this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
  }

  private handleNotification(notification: Notification) {
    // Store notification in localStorage for offline access
    this.storeNotification(notification);
    
    // Notify all handlers
    this.notificationHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });

    // Show browser notification if enabled
    this.showBrowserNotification(notification);
  }

  private storeNotification(notification: Notification) {
    try {
      const stored = localStorage.getItem('notifications');
      const notifications: Notification[] = stored ? JSON.parse(stored) : [];
      
      // Add new notification at the beginning
      notifications.unshift(notification);
      
      // Keep only last 100 notifications
      const limitedNotifications = notifications.slice(0, 100);
      
      localStorage.setItem('notifications', JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  private async showBrowserNotification(notification: Notification) {
    if (!('Notification' in window)) {
      return;
    }

    const settings = await this.getNotificationSettings();
    if (!settings.desktopNotifications) {
      return;
    }

    if (Notification.permission === 'granted') {
      const notificationOptions: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        data: notification.data,
        requireInteraction: notification.type === 'mention' || notification.type === 'group_invitation',
        silent: !settings.soundEnabled
      };

      const browserNotification = new Notification(notification.title, notificationOptions);
      
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds for non-important notifications
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }

  // API Methods
  async getNotifications(page = 0, limit = 20): Promise<{ notifications: Notification[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ notifications: Notification[]; totalCount: number; hasMore: boolean }>('/notifications', { page, limit });
      return response;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.get<{ count: number }>('/notifications/unread-count');
      return response.count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.put('/notifications/mark-all-read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await this.get<NotificationSettings>('/notifications/settings');
      return response;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      // Return default settings
      return {
        newFollowers: true,
        newPosts: true,
        mentions: true,
        directMessages: true,
        groupUpdates: true,
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: true,
        desktopNotifications: true
      };
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await this.put<NotificationSettings>('/notifications/settings', settings);
      return response;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  // Utility Methods
  getStoredNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  clearStoredNotifications(): void {
    localStorage.removeItem('notifications');
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'message':
        return '💬';
      case 'mention':
        return '👤';
      case 'group_invitation':
        return '👥';
      case 'follow':
        return '➕';
      case 'like':
        return '❤️';
      case 'comment':
        return '💭';
      case 'post':
        return '📝';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'message':
        return 'text-blue-600';
      case 'mention':
        return 'text-purple-600';
      case 'group_invitation':
        return 'text-green-600';
      case 'follow':
        return 'text-indigo-600';
      case 'like':
        return 'text-red-600';
      case 'comment':
        return 'text-yellow-600';
      case 'post':
        return 'text-gray-600';
      case 'system':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  }

  formatNotificationTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'message': '💬',
      'mention': '@',
      'group_invitation': '👥',
      'follow': '👤',
      'like': '❤️',
      'comment': '💭',
      'post': '📝',
      'system': '⚙️'
    };
    return iconMap[type] || '🔔';
  }

  getNotificationColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'message': 'text-blue-500',
      'mention': 'text-yellow-500',
      'group_invitation': 'text-green-500',
      'follow': 'text-purple-500',
      'like': 'text-red-500',
      'comment': 'text-blue-500',
      'post': 'text-gray-500',
      'system': 'text-gray-500'
    };
    return colorMap[type] || 'text-gray-500';
  }

  addNotificationHandler(handler: (notification: AppNotification) => void): void {
    this.notificationHandlers.push(handler);
  }

  removeNotificationHandler(handler: (notification: AppNotification) => void): void {
    const index = this.notificationHandlers.indexOf(handler);
    if (index > -1) {
      this.notificationHandlers.splice(index, 1);
    }
  }

  connect(userId: string, token: string): Promise<void> {
    // TODO: Implement WebSocket connection
    return Promise.resolve();
  }

  disconnect(): void {
    // TODO: Implement WebSocket disconnection
  }

  requestNotificationPermission(): Promise<string> {
    // TODO: Implement notification permission request
    return Promise.resolve('granted');
  }

  clearStoredNotifications(): void {
    // TODO: Implement clearing stored notifications
  }
}

export const notificationService = new NotificationService();