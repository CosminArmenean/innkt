import * as signalR from '@microsoft/signalr';
import { environment } from '../config/environment';
import { offlineStorageService } from './offline-storage.service';
import { monitoringService } from './monitoring.service';

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'message' | 'group_invite' | 'group_invitation' | 'post_mention' | 'system' | 'grok_response' | 'kid_follow_request' | 'kid_post' | 'kid_message' | 'kid_content_flagged' | 'kid_time_limit' | 'comment_notification' | 'like_notification' | 'follow_notification';
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  read: boolean;
  userId: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  actionUrl?: string;
  relatedContentId?: string;
  relatedContentType?: 'post' | 'comment' | 'user' | 'message';
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
    group_invitation: number;
    post_mention: number;
    system: number;
    grok_response: number;
    kid_follow_request: number;
    kid_post: number;
    kid_message: number;
    kid_content_flagged: number;
    kid_time_limit: number;
    comment_notification: number;
    like_notification: number;
    follow_notification: number;
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
  private connection: signalR.HubConnection | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  // Public getter for connection status
  public get connectionStatus(): boolean {
    return this.isConnected;
  }

  constructor() {
    this.initializeOfflineStorage();
    this.connect();
  }

  private async initializeOfflineStorage() {
    try {
      await offlineStorageService.initialize();
      console.log('📱 Offline storage initialized');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  public connect() {
    // Prevent multiple connections
    if (this.connection && this.connectionStatus) {
      console.log('🔔 Already connected to SignalR hub');
      return;
    }
    
    // Prevent connection attempts while already connecting
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connecting) {
      console.log('🔔 Connection already in progress, skipping...');
      return;
    }
    
    // If connection exists but is disconnected, stop it first
    if (this.connection && this.connection.state === signalR.HubConnectionState.Disconnected) {
      console.log('🔔 Stopping disconnected connection before reconnecting...');
      this.connection.stop();
      this.connection = null;
    }
    
    try {
      const hubUrl = `${environment.api.notifications}/notificationHub`;
      console.log('🔔 Connecting to SignalR hub at:', hubUrl);
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => {
            const token = localStorage.getItem('accessToken');
            console.log('🔔 Using token for SignalR:', !!token);
            return token || '';
          }
        })
        .withAutomaticReconnect()
        .build();

      this.connection.start().then(() => {
        console.log('🔔 Connected to notification service');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        monitoringService.updateConnectionStatus(true);
        this.emit('connected');
      }).catch((error) => {
        console.error('🔔 Connection error:', error);
        this.reconnectAttempts++;
        monitoringService.updateConnectionStatus(false);
        this.emit('error', error);
        
        // If connection fails, try to reconnect after a delay
        if (this.reconnectAttempts < 3) {
          setTimeout(() => {
            console.log('🔔 Retrying connection...');
            this.connect();
          }, 2000 * this.reconnectAttempts);
        }
      });

      this.connection.onclose((error) => {
        console.log('🔔 Disconnected from notification service:', error);
        this.isConnected = false;
        this.emit('disconnected', error);
      });

      // Listen for notifications
      this.connection.on('notification', async (notification: any) => {
        console.log('🔔 Received notification:', notification);
        console.log('🔔 Notification metadata:', notification.metadata);
        console.log('🔔 Notification data:', notification.data);
        
        // Normalize notification object to match our interface
        const normalizedNotification: Notification = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.message,
          data: notification.metadata,
          timestamp: notification.createdAt || notification.timestamp || new Date().toISOString(),
          read: notification.isRead || notification.read || false,
          userId: notification.recipientId,
          senderId: notification.senderId,
          senderName: notification.senderName || notification.metadata?.senderName,
          senderAvatar: notification.senderAvatar || notification.metadata?.senderAvatar,
          actionUrl: notification.metadata?.actionUrl || notification.data?.actionUrl,
          relatedContentId: notification.metadata?.relatedContentId || notification.data?.relatedContentId || notification.metadata?.postId,
          relatedContentType: notification.metadata?.relatedContentType || notification.data?.relatedContentType
        };
        
        // Store notification offline
        try {
          console.log('📱 Storing notification offline:', normalizedNotification.id, 'for user:', normalizedNotification.userId);
          await offlineStorageService.storeNotification(normalizedNotification);
          console.log('📱 Notification stored successfully');
        } catch (error) {
          console.error('Failed to store notification offline:', error);
        }
        
        // Update monitoring metrics
        monitoringService.incrementNotificationReceived(normalizedNotification.type);
        
        this.emit('notification', normalizedNotification);
      });

      // Listen for notification counts
      this.connection.on('notification_counts', (counts: NotificationCounts) => {
        console.log('🔔 Received notification counts:', counts);
        this.emit('counts', counts);
      });

      // Listen for real-time updates
      this.connection.on('follow_count', (count: number) => {
        this.emit('follow_count', count);
      });

      this.connection.on('message_count', (count: number) => {
        this.emit('message_count', count);
      });

      this.connection.on('group_invite_count', (count: number) => {
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
    if (this.connection && this.isConnected) {
      this.connection.invoke('Authenticate', userId, token);
    }
  }

  // Subscribe to user notifications
  subscribeToUser(userId: string) {
    if (this.connection && this.isConnected) {
      this.connection.invoke('SubscribeUser', userId);
    }
  }

  // Unsubscribe from user notifications
  unsubscribeFromUser(userId: string) {
    if (this.connection && this.isConnected) {
      this.connection.invoke('UnsubscribeUser', userId);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      // Call the API to mark notification as read
      const response = await fetch(`${environment.api.notifications}/api/notification/mark-read/${notificationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`);
      }

      // Also call SignalR if connected
      if (this.connection && this.isConnected) {
        try {
          await this.connection.invoke('MarkRead', notificationId);
        } catch (error) {
          // Silently handle connection errors to prevent user-facing errors
          console.warn('SignalR connection error during markAsRead (this is normal during navigation):', error);
        }
      }
      
      // Mark as read in offline storage
      try {
        await offlineStorageService.markAsRead(notificationId);
        monitoringService.incrementNotificationRead();
      } catch (error) {
        console.error('Failed to mark notification as read offline:', error);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const userId = localStorage.getItem('userId') || 'current-user';
      
      // Call the API to mark all notifications as read
      const response = await fetch(`${environment.api.notifications}/api/notification/user/${userId}/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
      }

      // Also call SignalR if connected
      if (this.connection && this.isConnected) {
        try {
          await this.connection.invoke('MarkAllRead');
        } catch (error) {
          // Silently handle connection errors to prevent user-facing errors
          console.warn('SignalR connection error during markAllAsRead (this is normal during navigation):', error);
        }
      }
      
      // Mark all as read in offline storage
      try {
        await offlineStorageService.markAllAsRead(userId);
      } catch (error) {
        console.error('Failed to mark all notifications as read offline:', error);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Disconnect gracefully
  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (error) {
        console.warn('Error during graceful disconnect:', error);
      } finally {
        this.connection = null;
        this.isConnected = false;
      }
    }
  }

  // Get notifications with smart loading strategy
  async getNotifications(page: number = 0, limit: number = 50, userId?: string): Promise<NotificationListResponse> {
    try {
      // Use provided userId or get from localStorage
      const actualUserId = userId || localStorage.getItem('userId') || 'current-user';
      console.log('📱 Getting notifications for user:', actualUserId);
      
      // First, try to fetch from backend API
      try {
        const response = await fetch(`${environment.api.notifications}/api/notification/user/${actualUserId}?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const backendNotifications = await response.json();
          console.log('📱 Retrieved backend notifications:', backendNotifications.length);
          
          // Convert backend notifications to our format
          const convertedNotifications = backendNotifications.map((notification: any) => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.message,
            data: notification.metadata || {},
            timestamp: notification.createdAt || new Date().toISOString(),
            read: notification.isRead || false,
            userId: notification.recipientId,
            senderId: notification.senderId,
            senderName: notification.metadata?.senderName,
            senderAvatar: notification.metadata?.senderAvatar,
            actionUrl: notification.metadata?.actionUrl,
            relatedContentId: notification.metadata?.relatedContentId || notification.metadata?.postId,
            relatedContentType: notification.metadata?.relatedContentType
          }));
          
          return {
            notifications: convertedNotifications,
            totalCount: convertedNotifications.length,
            hasMore: false
          };
        }
      } catch (apiError) {
        console.log('📱 Backend API not available, falling back to offline storage:', apiError);
      }
      
      // Fallback to offline storage
      const allOfflineNotifications = await offlineStorageService.getNotifications(actualUserId, 1000);
      console.log('📱 Retrieved offline notifications:', allOfflineNotifications.length);
      
      // Convert offline notifications to regular notifications
      const allNotifications = allOfflineNotifications.map(offline => ({
        id: offline.id,
        type: offline.type,
        title: offline.title,
        body: offline.body,
        data: offline.data,
        timestamp: offline.timestamp,
        read: offline.read,
        userId: offline.userId
      }));
      
      const unreadNotifications = allNotifications.filter(n => !n.read);
      let notificationsToReturn: Notification[];
      
      // Smart loading: if unread < 10, load newest 20 (read + unread), otherwise load all unread
      if (unreadNotifications.length < 10) {
        // Load newest 20 notifications (read + unread)
        notificationsToReturn = allNotifications
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);
      } else {
        // Load all unread notifications
        notificationsToReturn = unreadNotifications
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      
      const totalCount = notificationsToReturn.length;
      const paginatedNotifications = notificationsToReturn.slice(page * limit, (page + 1) * limit);

      return {
        notifications: paginatedNotifications,
        totalCount,
        hasMore: (page + 1) * limit < totalCount
      };
    } catch (error) {
      console.error('Failed to get notifications from offline storage:', error);
      return {
        notifications: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }

  // Get unread count (for compatibility with existing components)
  async getUnreadCount(userId?: string): Promise<number> {
    try {
      const actualUserId = userId || localStorage.getItem('userId') || 'current-user';
      
      // First, try to fetch from backend API
      try {
        const response = await fetch(`${environment.api.notifications}/api/notification/user/${actualUserId}/unread`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const unreadNotifications = await response.json();
          console.log('📱 Retrieved backend unread count:', unreadNotifications.length);
          return unreadNotifications.length;
        }
      } catch (apiError) {
        console.log('📱 Backend API not available for unread count, falling back to offline storage:', apiError);
      }
      
      // Fallback to offline storage
      const notifications = await offlineStorageService.getNotifications(actualUserId, 1000);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Failed to get unread count from offline storage:', error);
      return 0;
    }
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
    try {
      console.log('Deleting notification:', notificationId);
      await offlineStorageService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification from offline storage:', error);
    }
  }

  // Sync offline notifications when back online
  async syncOfflineNotifications() {
    try {
      const unsyncedNotifications = await offlineStorageService.getUnsyncedNotifications();
      
      for (const notification of unsyncedNotifications) {
        // Mark as synced in offline storage
        await offlineStorageService.markAsSynced(notification.offlineId);
        console.log('📱 Synced offline notification:', notification.offlineId);
      }
      
      console.log(`📱 Synced ${unsyncedNotifications.length} offline notifications`);
    } catch (error) {
      console.error('Failed to sync offline notifications:', error);
    }
  }

  // Get monitoring metrics
  getMonitoringMetrics() {
    return monitoringService.getHealthStatus();
  }

  // Navigate to notification-related content
  async navigateToNotification(notification: Notification, navigate?: (path: string) => void) {
    console.log('🧭 Navigating to notification:', notification);
    console.log('🧭 Notification type:', notification.type);
    console.log('🧭 Notification data:', notification.data);
    console.log('🧭 Related content ID:', notification.relatedContentId);
    
    // If using React Router navigation, we can keep the connection alive
    // If using window.location.href, we should gracefully disconnect first
    if (!navigate) {
      console.log('🧭 Using window.location.href, gracefully disconnecting SignalR...');
      await this.disconnect();
    }
    
    if (notification.actionUrl) {
      // Direct URL navigation
      console.log('🧭 Using actionUrl:', notification.actionUrl);
      if (navigate) {
        navigate(notification.actionUrl);
      } else {
        window.location.href = notification.actionUrl;
      }
      return;
    }

    // Smart navigation based on notification type and content
    console.log('🧭 Using smart navigation for type:', notification.type, 'relatedContentId:', notification.relatedContentId);
    switch (notification.type) {
      case 'comment':
      case 'comment_notification':
        if (notification.relatedContentId) {
          // Navigate to post with comment highlighted
          // For comment notifications, relatedContentId should be the post ID
          // We need to extract the comment ID from the notification data
          const commentId = notification.data?.commentId || notification.id;
          console.log('🧭 Navigating to comment:', `/post/${notification.relatedContentId}#comment-${commentId}`);
          if (navigate) {
            navigate(`/post/${notification.relatedContentId}#comment-${commentId}`);
          } else {
            window.location.href = `/post/${notification.relatedContentId}#comment-${commentId}`;
          }
        }
        break;
      case 'like':
      case 'like_notification':
        if (notification.relatedContentId) {
          // Navigate to the liked post
          console.log('🧭 Navigating to liked post:', `/post/${notification.relatedContentId}`);
          if (navigate) {
            navigate(`/post/${notification.relatedContentId}`);
          } else {
            window.location.href = `/post/${notification.relatedContentId}`;
          }
        }
        break;
      case 'follow':
      case 'follow_notification':
        if (notification.senderId) {
          // Navigate to user profile
          console.log('🧭 Navigating to user profile:', `/profile/${notification.senderId}`);
          if (navigate) {
            navigate(`/profile/${notification.senderId}`);
          } else {
            window.location.href = `/profile/${notification.senderId}`;
          }
        }
        break;
      case 'message':
        if (notification.relatedContentId) {
          // Navigate to conversation
          console.log('🧭 Navigating to conversation:', `/messages/${notification.relatedContentId}`);
          if (navigate) {
            navigate(`/messages/${notification.relatedContentId}`);
          } else {
            window.location.href = `/messages/${notification.relatedContentId}`;
          }
        }
        break;
      case 'post_mention':
        if (notification.relatedContentId) {
          // Navigate to mentioned post
          console.log('🧭 Navigating to mentioned post:', `/post/${notification.relatedContentId}`);
          if (navigate) {
            navigate(`/post/${notification.relatedContentId}`);
          } else {
            window.location.href = `/post/${notification.relatedContentId}`;
          }
        }
        break;
      case 'group_invitation':
        if (notification.relatedContentId) {
          // Navigate to invite page
          console.log('🧭 Navigating to group invitation:', `/invite/${notification.relatedContentId}`);
          if (navigate) {
            navigate(`/invite/${notification.relatedContentId}`);
          } else {
            window.location.href = `/invite/${notification.relatedContentId}`;
          }
        } else {
          // Fallback: use notification ID as invite ID
          console.log('🧭 No relatedContentId, using notification ID as invite ID:', `/invite/${notification.id}`);
          if (navigate) {
            navigate(`/invite/${notification.id}`);
          } else {
            window.location.href = `/invite/${notification.id}`;
          }
        }
        break;
      case 'kid_follow_request':
      case 'kid_post':
      case 'kid_message':
      case 'kid_content_flagged':
      case 'kid_time_limit':
        // Navigate to parent dashboard or kid management
        console.log('🧭 Navigating to parent dashboard');
        if (navigate) {
          navigate(`/parent-dashboard`);
        } else {
          window.location.href = `/parent-dashboard`;
        }
        break;
      default:
        // Default to notifications page
        console.log('🧭 No specific navigation found, defaulting to notifications page');
        if (navigate) {
          navigate(`/notifications`);
        } else {
          window.location.href = `/notifications`;
        }
    }
    
    // If no navigation was performed, fallback to notifications page
    if (!notification.relatedContentId && !notification.senderId) {
      console.log('🧭 No related content or sender, falling back to notifications page');
      window.location.href = `/notifications`;
    }
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