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

export type NotificationPermission = 'default' | 'granted' | 'denied';

class NotificationService extends BaseApiService {
  private socket: WebSocket | null = null;
  private notificationHandlers: ((notification: Notification) => void)[] = [];

  constructor() {
    super(apiConfig.officerApi.baseUrl);
  }

  // WebSocket Connection
  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${apiConfig.messagingApi.wsUrl}/notifications?userId=${userId}&token=${token}`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('Notification WebSocket connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const notification: Notification = JSON.parse(event.data);
            this.notificationHandlers.forEach(handler => handler(notification));
          } catch (error) {
            console.error('Failed to parse notification:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('Notification WebSocket error:', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('Notification WebSocket disconnected');
          this.socket = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Notification Handlers
  addNotificationHandler(handler: (notification: Notification) => void) {
    this.notificationHandlers.push(handler);
  }

  removeNotificationHandler(handler: (notification: Notification) => void) {
    this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
  }

  // API Methods
  async getNotifications(page = 0, limit = 20): Promise<{ notifications: Notification[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ notifications: Notification[]; totalCount: number; hasMore: boolean }>('/notifications', { 
        params: { page, limit } 
      });
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
      throw error;
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
      throw error;
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

  // Browser Notification Methods
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  }

  showBrowserNotification(notification: Notification) {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        tag: notification.id,
        data: notification.data
      });
    }
  }

  clearStoredNotifications(): void {
    localStorage.removeItem('notifications');
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
      'group_invitation': 'text-purple-500',
      'follow': 'text-green-500',
      'like': 'text-red-500',
      'comment': 'text-indigo-500',
      'post': 'text-orange-500',
      'system': 'text-gray-500'
    };
    return colorMap[type] || 'text-gray-500';
  }
}

export const notificationService = new NotificationService();
export type { Notification as AppNotification };
