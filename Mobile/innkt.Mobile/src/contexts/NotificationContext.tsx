import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService, Notification, NotificationPreferences } from '../services/notifications/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  // Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Utilities
  getNotificationById: (id: string) => Notification | undefined;
  getNotificationsByType: (type: string) => Notification[];
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  
  // Computed values
  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  
  // MARK: - Initialization
  
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeNotifications();
    }
  }, [isAuthenticated, user]);
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
  
  // MARK: - WebSocket Event Handlers
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Set up WebSocket event listeners
    const handleNotificationReceived = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    };
    
    const handleConnectionStatusChanged = (connected: boolean) => {
      setIsConnected(connected);
    };
    
    notificationService.onNotificationReceived(handleNotificationReceived);
    notificationService.onConnectionStatusChanged(handleConnectionStatusChanged);
    
    return () => {
      notificationService.removeEventListener('notificationReceived', handleNotificationReceived);
      notificationService.removeEventListener('connectionStatusChanged', handleConnectionStatusChanged);
    };
  }, [isAuthenticated]);
  
  // MARK: - Methods
  
  const initializeNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Load preferences first
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
      
      // Load initial notifications
      await refreshNotifications();
      
      // Connect to WebSocket if preferences allow
      if (prefs.inAppEnabled) {
        await connect();
      }
      
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    setAppState(nextAppState);
    
    if (nextAppState === 'active' && isAuthenticated && preferences?.inAppEnabled) {
      // App became active, try to reconnect if needed
      if (!isConnected) {
        connect();
      }
    }
  }, [isAuthenticated, preferences, isConnected]);
  
  const connect = async () => {
    try {
      await notificationService.connect();
    } catch (error) {
      console.error('Failed to connect to notification service:', error);
    }
  };
  
  const disconnect = async () => {
    try {
      await notificationService.disconnect();
    } catch (error) {
      console.error('Failed to disconnect from notification service:', error);
    }
  };
  
  const refreshNotifications = async () => {
    try {
      setIsLoading(true);
      const fetchedNotifications = await notificationService.getNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  };
  
  const archiveNotification = async (notificationId: string) => {
    try {
      await notificationService.archiveNotification(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isArchived: true, archivedAt: new Date() }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to archive notification:', error);
      throw error;
    }
  };
  
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  };
  
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      await notificationService.updatePreferences(newPreferences);
      
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
      
      // Handle connection changes based on preferences
      if (newPreferences.inAppEnabled !== undefined) {
        if (newPreferences.inAppEnabled && !isConnected) {
          await connect();
        } else if (!newPreferences.inAppEnabled && isConnected) {
          await disconnect();
        }
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  };
  
  const getNotificationById = useCallback((id: string): Notification | undefined => {
    return notifications.find(notification => notification.id === id);
  }, [notifications]);
  
  const getNotificationsByType = useCallback((type: string): Notification[] => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);
  
  const clearAllNotifications = async () => {
    try {
      await notificationService.clearLocalNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      throw error;
    }
  };
  
  // MARK: - Context Value
  
  const contextValue: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    preferences,
    
    // Actions
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications,
    updatePreferences,
    
    // Connection
    connect,
    disconnect,
    
    // Utilities
    getNotificationById,
    getNotificationsByType,
    clearAllNotifications,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// MARK: - Hook

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;






