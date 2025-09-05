import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { officerApiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../../config/environment';

export interface PushNotificationData {
  notificationId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  targetId?: string;
  targetType?: string;
  priority: 'high' | 'normal' | 'low';
  sound?: string;
  badge?: number;
  category?: string;
  threadId?: string;
  mutableContent?: boolean;
}

export interface PushNotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  previewEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  categories: {
    [key: string]: boolean;
  };
}

export interface IPushNotificationService {
  // Initialization
  initialize(): Promise<void>;
  requestPermission(): Promise<boolean>;
  
  // Device Token Management
  getDeviceToken(): Promise<string | null>;
  registerDeviceToken(token: string): Promise<void>;
  unregisterDeviceToken(): Promise<void>;
  
  // Notification Handling
  onNotificationReceived(callback: (data: PushNotificationData) => void): void;
  onNotificationOpened(callback: (data: PushNotificationData) => void>;
  onTokenRefresh(callback: (token: string) => void): void;
  
  // Settings
  getSettings(): Promise<PushNotificationSettings>;
  updateSettings(settings: Partial<PushNotificationSettings>): Promise<void>;
  
  // Utilities
  isPermissionGranted(): Promise<boolean>;
  removeAllListeners(): void;
  showLocalNotification(data: PushNotificationData): Promise<void>;
}

export class PushNotificationService implements IPushNotificationService {
  private deviceToken: string | null = null;
  private isInitialized = false;
  private eventListeners: Map<string, Function[]> = new Map();
  
  // MARK: - Initialization
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Check if Firebase is available
      if (!messaging) {
        console.warn('Firebase messaging not available');
        return;
      }
      
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Push notification permission denied');
        return;
      }
      
      // Get device token
      const token = await this.getDeviceToken();
      if (token) {
        await this.registerDeviceToken(token);
      }
      
      // Set up message handlers
      this.setupMessageHandlers();
      
      // Set up token refresh handler
      this.setupTokenRefreshHandler();
      
      this.isInitialized = true;
      console.log('Push notification service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      throw error;
    }
  }
  
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission({
          alert: true,
          announcement: false,
          badge: true,
          carPlay: false,
          criticalAlert: false,
          provisional: false,
          sound: true,
        });
        
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      } else {
        // Android permissions are handled in the manifest
        return true;
      }
    } catch (error) {
      console.error('Failed to request push notification permission:', error);
      return false;
    }
  }
  
  // MARK: - Device Token Management
  
  async getDeviceToken(): Promise<string | null> {
    try {
      if (!messaging) return null;
      
      const token = await messaging().getToken();
      this.deviceToken = token;
      
      // Store token locally
      await AsyncStorage.setItem('pushDeviceToken', token);
      
      return token;
    } catch (error) {
      console.error('Failed to get device token:', error);
      return null;
    }
  }
  
  async registerDeviceToken(token: string): Promise<void> {
    try {
      // Register with backend
      await officerApiClient.post(API_ENDPOINTS.OFFICER.PUSH_DEVICES, {
        deviceToken: token,
        platform: Platform.OS,
        appVersion: '1.0.0', // This should come from app config
        deviceModel: Platform.OS === 'ios' ? 'iPhone' : 'Android', // This should be more specific
        osVersion: Platform.Version.toString(),
        isActive: true,
        lastSeen: new Date().toISOString(),
      });
      
      console.log('Device token registered successfully');
      
    } catch (error) {
      console.error('Failed to register device token:', error);
      throw error;
    }
  }
  
  async unregisterDeviceToken(): Promise<void> {
    try {
      if (!this.deviceToken) return;
      
      // Unregister from backend
      await officerApiClient.delete(`${API_ENDPOINTS.OFFICER.PUSH_DEVICES}/${this.deviceToken}`);
      
      // Clear local token
      this.deviceToken = null;
      await AsyncStorage.removeItem('pushDeviceToken');
      
      console.log('Device token unregistered successfully');
      
    } catch (error) {
      console.error('Failed to unregister device token:', error);
      throw error;
    }
  }
  
  // MARK: - Message Handlers
  
  private setupMessageHandlers(): void {
    if (!messaging) return;
    
    // Handle messages when app is in foreground
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Received foreground message:', remoteMessage);
      
      const notificationData = this.parseRemoteMessage(remoteMessage);
      if (notificationData) {
        // Emit event for foreground handling
        this.emit('notificationReceived', notificationData);
        
        // Show local notification if settings allow
        const settings = await this.getSettings();
        if (settings.enabled && settings.previewEnabled) {
          await this.showLocalNotification(notificationData);
        }
      }
    });
    
    // Handle notification open when app is in background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      
      const notificationData = this.parseRemoteMessage(remoteMessage);
      if (notificationData) {
        this.emit('notificationOpened', notificationData);
      }
    });
    
    // Handle notification open when app is closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Initial notification:', remoteMessage);
          
          const notificationData = this.parseRemoteMessage(remoteMessage);
          if (notificationData) {
            this.emit('notificationOpened', notificationData);
          }
        }
      });
    
    // Store unsubscribe function
    this.eventListeners.set('foreground', [unsubscribeForeground]);
  }
  
  private setupTokenRefreshHandler(): void {
    if (!messaging) return;
    
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
      console.log('Token refreshed:', token);
      
      this.deviceToken = token;
      this.emit('tokenRefresh', token);
      
      // Re-register with backend
      this.registerDeviceToken(token);
    });
    
    this.eventListeners.set('tokenRefresh', [unsubscribeTokenRefresh]);
  }
  
  // MARK: - Event Listeners
  
  onNotificationReceived(callback: (data: PushNotificationData) => void): void {
    this.addEventListener('notificationReceived', callback);
  }
  
  onNotificationOpened(callback: (data: PushNotificationData) => void): void {
    this.addEventListener('notificationOpened', callback);
  }
  
  onTokenRefresh(callback: (token: string) => void): void {
    this.addEventListener('tokenRefresh', callback);
  }
  
  removeAllListeners(): void {
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    });
    this.eventListeners.clear();
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
          console.error(`Error in push notification event listener for ${event}:`, error);
        }
      });
    }
  }
  
  // MARK: - Settings
  
  async getSettings(): Promise<PushNotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem('pushNotificationSettings');
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Return default settings
      return this.getDefaultSettings();
      
    } catch (error) {
      console.error('Failed to get push notification settings:', error);
      return this.getDefaultSettings();
    }
  }
  
  async updateSettings(settings: Partial<PushNotificationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem('pushNotificationSettings', JSON.stringify(updatedSettings));
      
      // Update backend settings if user is authenticated
      try {
        await officerApiClient.put(API_ENDPOINTS.OFFICER.PUSH_SETTINGS, updatedSettings);
      } catch (error) {
        console.warn('Failed to update push settings on backend:', error);
      }
      
    } catch (error) {
      console.error('Failed to update push notification settings:', error);
      throw error;
    }
  }
  
  // MARK: - Utilities
  
  async isPermissionGranted(): Promise<boolean> {
    try {
      if (!messaging) return false;
      
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Failed to check push notification permission:', error);
      return false;
    }
  }
  
  async showLocalNotification(data: PushNotificationData): Promise<void> {
    // This would integrate with a local notification library
    // For now, show an alert
    Alert.alert(
      data.title,
      data.body,
      [
        {
          text: 'View',
          onPress: () => {
            if (data.actionUrl) {
              Linking.openURL(data.actionUrl);
            }
          },
        },
        {
          text: 'Dismiss',
          style: 'cancel',
        },
      ]
    );
  }
  
  // MARK: - Private Methods
  
  private parseRemoteMessage(remoteMessage: any): PushNotificationData | null {
    try {
      const { notification, data } = remoteMessage;
      
      if (!notification) return null;
      
      return {
        notificationId: data?.notificationId || `push_${Date.now()}`,
        type: data?.type || 'general',
        title: notification.title || 'Notification',
        body: notification.body || '',
        data: data || {},
        actionUrl: data?.actionUrl,
        targetId: data?.targetId,
        targetType: data?.targetType,
        priority: data?.priority || 'normal',
        sound: notification.sound,
        badge: notification.badge,
        category: data?.category,
        threadId: data?.threadId,
        mutableContent: data?.mutableContent || false,
      };
    } catch (error) {
      console.error('Failed to parse remote message:', error);
      return null;
    }
  }
  
  private getDefaultSettings(): PushNotificationSettings {
    return {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      badgeEnabled: true,
      previewEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      categories: {
        general: true,
        posts: true,
        comments: true,
        likes: true,
        follows: true,
        mentions: true,
        system: true,
        security: true,
      },
    };
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;






