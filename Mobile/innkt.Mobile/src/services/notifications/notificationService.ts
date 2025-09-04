import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { AppUser, NotificationType, NotificationPriority } from '../../models/user';
import { officerApiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../../config/environment';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  readAt?: Date;
  archivedAt?: Date;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  targetId?: string;
  targetType?: string;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  timezone: string;
  categories: {
    [key in NotificationType]: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  batchSize: number;
}

export interface WebSocketMessage {
  type: 'notification' | 'status' | 'error' | 'ping' | 'pong';
  data: any;
  timestamp: number;
  messageId: string;
}

export interface INotificationService {
  // WebSocket Management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Notification Management
  getNotifications(page?: number, pageSize?: number): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  archiveNotification(notificationId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  
  // Preferences
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void>;
  
  // Push Notifications
  registerForPushNotifications(): Promise<string | null>;
  unregisterFromPushNotifications(): Promise<void>;
  
  // Local Storage
  saveNotificationLocally(notification: Notification): Promise<void>;
  getLocalNotifications(): Promise<Notification[]>;
  clearLocalNotifications(): Promise<void>;
  
  // Event Listeners
  onNotificationReceived(callback: (notification: Notification) => void): void;
  onConnectionStatusChanged(callback: (connected: boolean) => void): void;
  removeEventListener(event: string, callback: Function): void;
}

export class NotificationService implements INotificationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnecting = false;
  private appState: AppStateStatus = 'active';
  
  // WebSocket configuration
  private readonly wsUrl = 'wss://localhost:5002/ws/notifications';
  private readonly heartbeatIntervalMs = 30000; // 30 seconds
  
  constructor() {
    this.setupAppStateListener();
  }
  
  // MARK: - WebSocket Management
  
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }
    
    this.isConnecting = true;
    
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      this.ws = new WebSocket(`${this.wsUrl}?token=${token}`);
      this.setupWebSocketEventHandlers();
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.emit('connectionStatusChanged', false);
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  private setupWebSocketEventHandlers(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connectionStatusChanged', true);
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      this.emit('connectionStatusChanged', false);
      
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    };
  }
  
  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'notification':
        const notification = this.parseNotificationFromMessage(message.data);
        if (notification) {
          this.saveNotificationLocally(notification);
          this.emit('notificationReceived', notification);
        }
        break;
        
      case 'status':
        console.log('WebSocket status update:', message.data);
        break;
        
      case 'error':
        console.error('WebSocket error message:', message.data);
        break;
        
      case 'pong':
        // Heartbeat response received
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }
  
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendHeartbeat();
      }
    }, this.heartbeatIntervalMs);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private sendHeartbeat(): void {
    if (this.ws && this.isConnected()) {
      const heartbeatMessage: WebSocketMessage = {
        type: 'ping',
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
        messageId: `ping_${Date.now()}`
      };
      
      this.ws.send(JSON.stringify(heartbeatMessage));
    }
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.appState === 'active') {
        this.connect();
      }
    }, delay);
  }
  
  // MARK: - Notification Management
  
  async getNotifications(page: number = 1, pageSize: number = 20): Promise<Notification[]> {
    try {
      const response = await officerApiClient.get<Notification[]>(
        `${API_ENDPOINTS.OFFICER.NOTIFICATIONS}?page=${page}&pageSize=${pageSize}`
      );
      
      if (response.success && response.data) {
        return response.data.map(this.parseNotification);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to local notifications
      return this.getLocalNotifications();
    }
  }
  
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await officerApiClient.put(`${API_ENDPOINTS.OFFICER.NOTIFICATIONS}/${notificationId}/read`, {});
      
      // Update local notification
      const localNotifications = await this.getLocalNotifications();
      const updatedNotifications = localNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true, readAt: new Date() }
          : notification
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }
  
  async markAllAsRead(): Promise<void> {
    try {
      await officerApiClient.put(`${API_ENDPOINTS.OFFICER.NOTIFICATIONS}/mark-all-read`, {});
      
      // Update local notifications
      const localNotifications = await this.getLocalNotifications();
      const updatedNotifications = localNotifications.map(notification => ({
        ...notification,
        isRead: true,
        readAt: new Date()
      }));
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }
  
  async archiveNotification(notificationId: string): Promise<void> {
    try {
      await officerApiClient.put(`${API_ENDPOINTS.OFFICER.NOTIFICATIONS}/${notificationId}/archive`, {});
      
      // Update local notification
      const localNotifications = await this.getLocalNotifications();
      const updatedNotifications = localNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isArchived: true, archivedAt: new Date() }
          : notification
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
    } catch (error) {
      console.error('Failed to archive notification:', error);
      throw error;
    }
  }
  
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await officerApiClient.delete(`${API_ENDPOINTS.OFFICER.NOTIFICATIONS}/${notificationId}`);
      
      // Remove from local storage
      const localNotifications = await this.getLocalNotifications();
      const filteredNotifications = localNotifications.filter(
        notification => notification.id !== notificationId
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(filteredNotifications));
      
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }
  
  // MARK: - Preferences
  
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await officerApiClient.get<NotificationPreferences>(
        API_ENDPOINTS.OFFICER.NOTIFICATION_PREFERENCES
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Return default preferences
      return this.getDefaultPreferences();
      
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }
  
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      await officerApiClient.put(
        API_ENDPOINTS.OFFICER.NOTIFICATION_PREFERENCES,
        preferences
      );
      
      // Update local preferences
      const currentPreferences = await this.getPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(updatedPreferences));
      
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }
  
  // MARK: - Push Notifications
  
  async registerForPushNotifications(): Promise<string | null> {
    // This would integrate with Firebase Cloud Messaging
    // For now, return a mock device token
    console.log('Push notification registration not implemented yet');
    return null;
  }
  
  async unregisterFromPushNotifications(): Promise<void> {
    // This would unregister from Firebase Cloud Messaging
    console.log('Push notification unregistration not implemented yet');
  }
  
  // MARK: - Local Storage
  
  async saveNotificationLocally(notification: Notification): Promise<void> {
    try {
      const existingNotifications = await this.getLocalNotifications();
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Keep only the last 100 notifications locally
      const limitedNotifications = updatedNotifications.slice(0, 100);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Failed to save notification locally:', error);
    }
  }
  
  async getLocalNotifications(): Promise<Notification[]> {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        return notifications.map(this.parseNotification);
      }
      return [];
    } catch (error) {
      console.error('Failed to get local notifications:', error);
      return [];
    }
  }
  
  async clearLocalNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notifications');
    } catch (error) {
      console.error('Failed to clear local notifications:', error);
    }
  }
  
  // MARK: - Event Listeners
  
  onNotificationReceived(callback: (notification: Notification) => void): void {
    this.addEventListener('notificationReceived', callback);
  }
  
  onConnectionStatusChanged(callback: (connected: boolean) => void): void {
    this.addEventListener('connectionStatusChanged', callback);
  }
  
  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const filteredListeners = listeners.filter(listener => listener !== callback);
      this.eventListeners.set(event, filteredListeners);
    }
  }
  
  private addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    const listeners = this.eventListeners.get(event)!;
    listeners.push(callback);
  }
  
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  // MARK: - Private Methods
  
  private async getAuthToken(): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem('authData');
      if (stored) {
        const authData = JSON.parse(stored);
        return authData.accessToken || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }
  
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.appState = nextAppState;
      
      if (nextAppState === 'active') {
        // App became active, try to reconnect if needed
        if (!this.isConnected() && !this.isConnecting) {
          this.connect();
        }
      } else if (nextAppState === 'background') {
        // App went to background, reduce WebSocket activity
        this.stopHeartbeat();
      }
    });
  }
  
  private parseNotification(data: any): Notification {
    return {
      id: data.id || `local_${Date.now()}`,
      type: data.type || NotificationType.GENERAL,
      title: data.title || 'Notification',
      message: data.message || '',
      data: data.data || {},
      priority: data.priority || NotificationPriority.NORMAL,
      isRead: data.isRead || false,
      isArchived: data.isArchived || false,
      createdAt: new Date(data.createdAt || Date.now()),
      readAt: data.readAt ? new Date(data.readAt) : undefined,
      archivedAt: data.archivedAt ? new Date(data.archivedAt) : undefined,
      senderId: data.senderId,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      targetId: data.targetId,
      targetType: data.targetType,
      actionUrl: data.actionUrl,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
    };
  }
  
  private parseNotificationFromMessage(data: any): Notification | null {
    try {
      return this.parseNotification(data);
    } catch (error) {
      console.error('Failed to parse notification from WebSocket message:', error);
      return null;
    }
  }
  
  private getDefaultPreferences(): NotificationPreferences {
    return {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      categories: {
        [NotificationType.GENERAL]: true,
        [NotificationType.POST]: true,
        [NotificationType.COMMENT]: true,
        [NotificationType.LIKE]: true,
        [NotificationType.FOLLOW]: true,
        [NotificationType.MENTION]: true,
        [NotificationType.SYSTEM]: true,
        [NotificationType.SECURITY]: true
      },
      frequency: 'immediate',
      batchSize: 10
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;





