import { BaseApiService, officerApi } from './api.service';

export interface AppNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'group_invite' | 'system' | 'security';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  senderProfile?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  notificationTypes: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    mentions: boolean;
    groupInvites: boolean;
    systemUpdates: boolean;
    securityAlerts: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
}

class NotificationService extends BaseApiService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    super(officerApi);
  }

  // Get user notifications
  async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  } = {}): Promise<{ notifications: AppNotification[]; total: number; unreadCount: number }> {
    try {
      const response = await this.get('/notifications', { params });
      return (response as any).data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return { notifications: [], total: 0, unreadCount: 0 };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.put(`/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await this.put('/notifications/read-all', {});
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  // Get notification settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await this.get('/notifications/settings');
      return (response as any).data;
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      // Return default settings
      return {
        pushNotifications: true,
        emailNotifications: true,
        inAppNotifications: true,
        notificationTypes: {
          likes: true,
          comments: true,
          follows: true,
          mentions: true,
          groupInvites: true,
          systemUpdates: true,
          securityAlerts: true,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };
    }
  }

  // Update notification settings
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      await this.put('/notifications/settings', settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(
    onNotification: (notification: AppNotification) => void,
    onError?: (error: Event) => void
  ): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token available for notifications');
      return;
    }

    const url = `${this.api.defaults.baseURL}/notifications/stream?token=${token}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const notification: AppNotification = JSON.parse(event.data);
        onNotification(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      if (onError) {
        onError(error);
      }
      this.handleReconnect(onNotification, onError);
    };

    this.eventSource.onopen = () => {
      console.log('Connected to notification stream');
      this.reconnectAttempts = 0;
    };
  }

  // Handle reconnection for notification stream
  private handleReconnect(
    onNotification: (notification: AppNotification) => void,
    onError?: (error: Event) => void
  ): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect to notifications (attempt ${this.reconnectAttempts})`);
      this.unsubscribeFromNotifications();
      this.subscribeToNotifications(onNotification, onError);
    }, delay);
  }

  // Unsubscribe from notifications
  unsubscribeFromNotifications(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Send test notification (for development)
  async sendTestNotification(type: string, message: string): Promise<void> {
    try {
      await this.post('/notifications/test', { type, message });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      const response = await this.get('/notifications/stats');
      return (response as any).data;
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        recentActivity: [],
      };
    }
  }
}

export const notificationService = new NotificationService();

