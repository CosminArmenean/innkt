import { BaseApiService } from './api.service';
import { io, Socket } from 'socket.io-client';

// Enhanced notification types for new Notifications service
export interface BaseNotification {
  id: string;
  type: string;
  recipientId: string;
  senderId?: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  priority: string; // low, medium, high, urgent
  channel: string; // in_app, email, push, sms
  metadata: Record<string, any>;
}

export interface KidNotification extends BaseNotification {
  kidAccountId: string;
  parentAccountId: string;
  parentVisible: boolean;
  safetyChecked: boolean;
  safetyScore: number;
  safetyFlags: string[];
  requiresParentAction: boolean;
}

export interface ParentNotification extends BaseNotification {
  parentAccountId: string;
  kidAccountId: string;
  requestType: string;
  targetUserId?: string;
  requestData: string;
  requiresAction: boolean;
  expiresAt?: string;
  status: string;
}

export interface SafetyAlertNotification extends BaseNotification {
  kidAccountId?: string;
  alertType: string;
  severity: string;
  description: string;
  safetyData: Record<string, any>;
}

export interface GrokResponseNotification extends BaseNotification {
  originalCommentId: string;
  postId: string;
  grokCommentId: string;
  originalQuestion: string;
  grokConfidence: number;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  parentOversight: boolean;
  allowedTypes: string[];
  blockedTypes: string[];
  quietHoursStart: string;
  quietHoursEnd: string;
  respectQuietHours: boolean;
}

/**
 * Enhanced Notification Service - Kafka-powered with kid-safe filtering
 */
class EnhancedNotificationService extends BaseApiService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    super('/api/notifications'); // New Notifications service endpoint
    this.initializeRealTimeConnection();
  }

  /**
   * Initialize real-time notification connection
   */
  private initializeRealTimeConnection() {
    try {
      this.socket = io('http://localhost:5006', {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to Notifications service');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from Notifications service');
        this.isConnected = false;
      });

      this.socket.on('notification', (notification: BaseNotification) => {
        this.handleIncomingNotification(notification);
      });

      this.socket.on('safety_alert', (alert: SafetyAlertNotification) => {
        this.handleSafetyAlert(alert);
      });

      this.socket.on('grok_response', (response: GrokResponseNotification) => {
        this.handleGrokResponse(response);
      });

    } catch (error) {
      console.error('❌ Error initializing real-time notifications:', error);
    }
  }

  /**
   * Get user notifications with kid-safe filtering
   */
  async getNotifications(page: number = 1, pageSize: number = 20): Promise<BaseNotification[]> {
    try {
      const response = await this.get<BaseNotification[]>(`/?page=${page}&pageSize=${pageSize}`);
      console.log(`📥 Retrieved ${response.length} notifications`);
      return response;
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await this.put(`/${notificationId}/read`);
      console.log('✅ Notification marked as read:', notificationId);
      return true;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await this.put('/mark-all-read');
      console.log('✅ All notifications marked as read');
      return true;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Send emergency alert (for panic button)
   */
  async sendEmergencyAlert(alert: Omit<SafetyAlertNotification, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      await this.post('/emergency', alert);
      console.log('🚨 Emergency alert sent:', alert.alertType);
      return true;
    } catch (error) {
      console.error('❌ CRITICAL: Error sending emergency alert:', error);
      return false;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      return await this.get<NotificationPreferences>('/preferences');
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error);
      throw new Error('Failed to get notification preferences');
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      await this.put('/preferences', preferences);
      console.log('✅ Notification preferences updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Subscribe to specific notification types
   */
  subscribe(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    if (this.socket) {
      this.socket.on(eventType, callback as any);
    }
  }

  /**
   * Unsubscribe from notification type
   */
  unsubscribe(eventType: string, callback?: Function) {
    if (callback) {
      const callbacks = this.listeners.get(eventType) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(eventType);
    }

    if (this.socket) {
      this.socket.off(eventType, callback as any);
    }
  }

  /**
   * Handle incoming notification
   */
  private handleIncomingNotification(notification: BaseNotification) {
    console.log('📥 Incoming notification:', notification.type);
    
    // Emit to specific listeners
    const callbacks = this.listeners.get(notification.type) || [];
    callbacks.forEach(callback => callback(notification));
    
    // Emit to general notification listeners
    const generalCallbacks = this.listeners.get('notification') || [];
    generalCallbacks.forEach(callback => callback(notification));
  }

  /**
   * Handle safety alert (high priority)
   */
  private handleSafetyAlert(alert: SafetyAlertNotification) {
    console.log('🚨 SAFETY ALERT:', alert.alertType, alert.severity);
    
    // Show immediate alert for emergency situations
    if (alert.severity === 'emergency') {
      // This would trigger a modal or urgent notification in the UI
      const callbacks = this.listeners.get('emergency_alert') || [];
      callbacks.forEach(callback => callback(alert));
    }
    
    // Handle as regular notification too
    this.handleIncomingNotification(alert);
  }

  /**
   * Handle Grok AI response notification
   */
  private handleGrokResponse(response: GrokResponseNotification) {
    console.log('🤖 Grok response notification:', response.originalQuestion);
    
    const callbacks = this.listeners.get('grok_response') || [];
    callbacks.forEach(callback => callback(response));
    
    this.handleIncomingNotification(response);
  }

  /**
   * Disconnect from real-time notifications
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('📴 Disconnected from Notifications service');
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();

